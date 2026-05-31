"use strict"
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    MessageFlags
} = require(`discord.js`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const { TradeSession, TradeError, STATE, ARTCOINS_ITEM_ID, NON_LINE_ITEM_IDS } = require(`../../libs/trade`)
const { isInteractionCallbackResponse } = require(`../../utils/appCmdHelp`)

/**
 * Player-to-player trading. Two participants exchange items + artcoins inside
 * a single guild through a paired confirmation flow.
 *
 * The state machine and atomic execution live in `src/libs/trade.js`. This
 * file is the Discord adapter — it owns the embed, the button rows, the
 * modals, and the message-component collector that drives them.
 *
 * @link docs/trade-system-design.md
 * @author klerikdust
0 */
module.exports = {
    name: `trade`,
    aliases: [`trade`, `tr`],
    description: `Trade items and artcoins with another member of this server.`,
    usage: `trade <User>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `User you wish to trade with`,
        required: true,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    REQUEST_TIMEOUT_MS: 30 * 1000,
    IDLE_TIMEOUT_MS: 5 * 60 * 1000,
    FINAL_TIMEOUT_MS: 15 * 1000,
    ARTCOINS_EMOJI_ID: `758720612087627787`,

    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale(`TRADE.GUIDE`), {
            socket: { prefix: client.prefix }
        })
        const userLib = new User(client, message)
        const lookup = await userLib.lookFor(arg)
        if (!lookup) return await reply.send(locale(`USER.IS_INVALID`))
        const target = lookup.master || lookup
        return await this.run(client, reply, message, locale, target)
    },

    async Iexecute(client, reply, interaction, options, locale) {
        const target = options.getUser(`user`)
        if (!target) return await reply.send(locale(`USER.IS_INVALID`))
        return await this.run(client, reply, interaction, locale, target)
    },

    async run(client, reply, messageRef, locale, target) {
        const initiator = messageRef.member.user
        //  Self-trade is normally an instant rejection. The bypass requires
        //  BOTH `NODE_ENV=development` AND `BYPASS_SELF_TRADE=1`. Either alone
        //  is not enough — keeps a stray env var from accidentally enabling
        //  self-trade in a production-ish environment, and keeps a misnamed
        //  NODE_ENV from doing it either.
        const selfTradeAllowed = process.env.NODE_ENV === `development`
            && (process.env.BYPASS_SELF_TRADE === `1` || process.env.BYPASS_SELF_TRADE === `true`)
        if (target.id === initiator.id && !selfTradeAllowed) return await reply.send(locale(`TRADE.SELF_TRADE`), {
            socket: { emoji: await client.getEmoji(`692428748838010970`) }
        })
        if (target.bot) return await reply.send(locale(`TRADE.BOT_TRADE`))

        const isSelfTrade = target.id === initiator.id
        const session = new TradeSession({
            db: client.db,
            guildId: messageRef.guild.id,
            userAId: initiator.id,
            userBId: target.id,
            allowSelfTrade: isSelfTrade,
            deps: { logger: client.logger }
        })

        try {
            await session.requireBothFree()
        } catch (err) {
            if (err instanceof TradeError && err.code === `ALREADY_IN_TRADE`) {
                const which = err.detail === `b` ? target.username : initiator.username
                return await reply.send(locale(`TRADE.ALREADY_IN_TRADE`), { socket: { user: which } })
            }
            throw err
        }
        await session.acquireLocks()

        try {
            //  Step 1 — request prompt is only sent when there's a second
            //  human to ask. Self-trade jumps straight to the active
            //  session because there's no one to accept.
            if (!isSelfTrade) {
                const accepted = await this.promptRequest(client, reply, locale, messageRef, initiator, target)
                if (!accepted) return
            }

            //  Step 2+ — active session. Owns its own message + collector.
            await this.runActiveSession(client, reply, locale, messageRef, session, initiator, target)
        } finally {
            await session.releaseLocks()
        }
    },

    /**
     * Render the request embed, attach Accept/Decline buttons, and resolve
     * to true once user B accepts. Resolves false on decline, timeout, or
     * any error path. Side effect: the request message is removed when this
     * settles, regardless of outcome.
     */
    async promptRequest(client, reply, locale, messageRef, initiator, target) {
        const acceptBtn = new ButtonBuilder().setCustomId(`trade:accept`).setLabel(`Accept`).setStyle(ButtonStyle.Success)
        const declineBtn = new ButtonBuilder().setCustomId(`trade:decline`).setLabel(`Decline`).setStyle(ButtonStyle.Danger)
        const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn)
        const sent = await reply.send(locale(`TRADE.REQUEST_PROMPT`), {
            socket: { a: initiator.username, b: target.username },
            components: [row]
        })
        const requestMessage = isInteractionCallbackResponse(sent) ? sent.resource && sent.resource.message : sent
        if (!requestMessage) return false

        const collector = requestMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.REQUEST_TIMEOUT_MS,
            filter: i => i.user.id === target.id || i.user.id === initiator.id,
            max: 1
        })

        const result = await new Promise(resolve => {
            collector.on(`collect`, async i => {
                //  Only B is allowed to accept/decline. Filter above lets A
                //  through too so we can give them feedback rather than the
                //  silent collector ignore.
                if (i.user.id !== target.id) {
                    return i.reply({ content: locale(`TRADE.NOT_PARTICIPANT`), flags: MessageFlags.Ephemeral })
                }
                if (i.customId === `trade:accept`) {
                    await i.update({ components: [] }).catch(() => {})
                    return resolve(true)
                }
                if (i.customId === `trade:decline`) {
                    await i.update({ components: [] }).catch(() => {})
                    await reply.send(locale(`TRADE.REQUEST_DECLINED`), { socket: { b: target.username } })
                    return resolve(false)
                }
                return resolve(false)
            })
            collector.on(`end`, async (_collected, reasonStr) => {
                if (reasonStr === `time`) {
                    try { await requestMessage.edit({ components: [] }) } catch (_) { /* deleted */ }
                    await reply.send(locale(`TRADE.REQUEST_TIMEOUT`), { socket: { b: target.username } })
                    resolve(false)
                }
            })
        })
        return result
    },

    /**
     * Drive the post-accept lifecycle: render the trade window, listen for
     * Add/Remove/SetAc/Ready/Cancel button presses, and execute when both
     * sides confirm. Returns when the session reaches a terminal state.
     */
    async runActiveSession(client, reply, locale, messageRef, session, initiator, target) {
        session.accept()

        //  The dual-pane trade window doesn't fit Response.send's contract —
        //  Response builds its own embed from the `content` arg and ignores
        //  caller-supplied embeds. We need a custom embed (description +
        //  two inline fields), so send straight through the channel and let
        //  Response handle the simpler "send a flash message" calls below
        //  (cancel, success, etc.).
        const tradeEmbed = await this.renderEmbed(client, locale, messageRef, session, initiator, target)
        const tradeMessage = await messageRef.channel.send({
            embeds: [tradeEmbed],
            components: this.buildButtonRows(session)
        })
        if (!tradeMessage) {
            session.cancel(`render_failed`)
            return
        }

        const collector = tradeMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.IDLE_TIMEOUT_MS,
            filter: i => i.user.id === initiator.id || i.user.id === target.id
        })

        let finalCommitTimer = null
        const clearFinalTimer = () => {
            if (finalCommitTimer) { clearTimeout(finalCommitTimer); finalCommitTimer = null }
        }

        const refreshUi = async (interaction) => {
            const embed = await this.renderEmbed(client, locale, messageRef, session, initiator, target)
            //  Always reply via interaction.update so Discord doesn't surface
            //  "this interaction failed" — the collector also calls editReply
            //  on the parent message, which we use after non-interaction edits
            //  (timer-driven state changes).
            if (interaction) {
                await interaction.update({ embeds: [embed], components: this.buildButtonRows(session) }).catch(() => {})
            } else {
                await tradeMessage.edit({ embeds: [embed], components: this.buildButtonRows(session) }).catch(() => {})
            }
        }

        await new Promise(resolve => {
            const finishWith = async (statusKey, payload = {}) => {
                clearFinalTimer()
                try { await tradeMessage.edit({ components: [] }) } catch (_) { /* deleted */ }
                if (statusKey) await reply.send(locale(statusKey), payload).catch(() => {})
                collector.stop(`done`)
                resolve()
            }

            collector.on(`collect`, async i => {
                //  In normal trades, the side is whoever clicked. In self-trade
                //  (dev only — gated by NODE_ENV=development + BYPASS_SELF_TRADE),
                //  both columns belong to the same user; the Switch button toggles
                //  which side subsequent clicks affect.
                const side = session.isSelfTrade
                    ? session.currentSide
                    : (i.user.id === initiator.id ? `a` : `b`)
                try {
                    switch (i.customId) {
                        case `trade:switch`: {
                            //  Self-trade only — no-op when not in self-trade
                            //  mode (the button isn't even rendered).
                            session.currentSide = session.currentSide === `a` ? `b` : `a`
                            return await refreshUi(i)
                        }

                        case `trade:cancel`:
                            session.cancel(`user_cancel`)
                            return await finishWith(`TRADE.CANCELLED`)

                        case `trade:ready`: {
                            const wasReadied = session.state === STATE.READIED
                            session.setReady(side, !session.snapshot().ready[side])
                            if (session.state === STATE.READIED && !wasReadied) {
                                //  Both ready now — open final-confirm window.
                                clearFinalTimer()
                                finalCommitTimer = setTimeout(async () => {
                                    if (session.state !== STATE.READIED) return
                                    //  Treat the timeout as both sides toggling
                                    //  off; the session goes back to ACTIVE.
                                    session.setReady(`a`, false)
                                    session.setReady(`b`, false)
                                    await refreshUi()
                                    await reply.send(locale(`TRADE.FINAL_TIMEOUT`)).catch(() => {})
                                }, this.FINAL_TIMEOUT_MS)
                                await refreshUi(i)
                                //  Run execute when both sides have toggled.
                                //  We commit on the second ready click, not on
                                //  a separate button — simpler UX, matches the
                                //  design doc's `both Ready -> READIED -> exec`.
                                const result = await session.execute()
                                clearFinalTimer()
                                if (result.ok) {
                                    return await finishWith(`TRADE.EXEC_SUCCESS`, {
                                        socket: { tradeId: result.tradeId }
                                    })
                                }
                                if (result.code === `INSUFFICIENT_ITEM` || result.code === `INSUFFICIENT_ARTCOINS`) {
                                    //  Whoever's debit failed is in `result.detail`;
                                    //  we name the side back to the user via session
                                    //  ids — keeping it brief here.
                                    return await finishWith(`TRADE.EXEC_FAILED_INSUFFICIENT`, {
                                        socket: { user: result.detail || `someone` }
                                    })
                                }
                                return await finishWith(`TRADE.EXEC_FAILED_GENERIC`)
                            }
                            return await refreshUi(i)
                        }

                        case `trade:setac`: {
                            const modalId = `trade:setac:${i.id}`
                            const input = new TextInputBuilder()
                                .setCustomId(`amount`)
                                .setLabel(locale(`TRADE.AC_MODAL_LABEL`))
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                            const modal = new ModalBuilder()
                                .setCustomId(modalId)
                                .setTitle(locale(`TRADE.AC_MODAL_TITLE`))
                                .addComponents(new ActionRowBuilder().addComponents(input))
                            await i.showModal(modal)
                            collector.resetTimer()
                            const submission = await i.awaitModalSubmit({
                                time: 60 * 1000,
                                filter: s => s.customId === modalId
                            }).catch(() => null)
                            if (!submission) return
                            const raw = submission.fields.getTextInputValue(`amount`).trim()
                            const amount = trueInt(raw) || (raw === `0` ? 0 : NaN)
                            if (!Number.isInteger(amount) || amount < 0) {
                                await submission.reply({ content: locale(`TRADE.AC_INVALID`), flags: MessageFlags.Ephemeral })
                                return
                            }
                            //  Friendly preflight against the user's actual balance.
                            const balance = await client.db.userUtils.getUserBalance(
                                side === `a` ? initiator.id : target.id,
                                messageRef.guild.id
                            )
                            if (amount > balance) {
                                await submission.reply({
                                    content: locale(`TRADE.AC_INSUFFICIENT`),
                                    flags: MessageFlags.Ephemeral
                                })
                                return
                            }
                            session.setArtcoins(side, amount)
                            await submission.deferUpdate().catch(() => {})
                            return await refreshUi()
                        }

                        case `trade:add`: {
                            //  Two-step flow: select item from inventory, then
                            //  modal for qty. A single modal can't host a
                            //  select menu (Discord limitation), so the
                            //  ephemeral select runs first.
                            const ownerId = side === `a` ? initiator.id : target.id
                            const candidates = await this.fetchTradeableInventory(client, messageRef.guild.id, ownerId)
                            if (!candidates.length) {
                                return i.reply({
                                    content: locale(`TRADE.ADD_NO_TRADEABLE_ITEMS`),
                                    flags: MessageFlags.Ephemeral
                                })
                            }
                            const selectId = `trade:add:select:${i.id}`
                            const select = new StringSelectMenuBuilder()
                                .setCustomId(selectId)
                                .setPlaceholder(locale(`TRADE.ADD_SELECT_PLACEHOLDER`))
                                .addOptions(candidates.slice(0, 25).map(c => ({
                                    label: this.truncate(c.name, 100),
                                    description: this.truncate(`Owned: ${c.quantity}`, 100),
                                    value: String(c.item_id)
                                })))
                            await i.reply({
                                content: locale(`TRADE.ADD_SELECT_PROMPT`),
                                components: [new ActionRowBuilder().addComponents(select)],
                                flags: MessageFlags.Ephemeral
                            })
                            collector.resetTimer()
                            const selectInteraction = await i.fetchReply().then(reply => reply.awaitMessageComponent({
                                componentType: ComponentType.StringSelect,
                                filter: s => s.customId === selectId && s.user.id === i.user.id,
                                time: 60 * 1000
                            })).catch(() => null)
                            if (!selectInteraction) {
                                await i.editReply({
                                    content: locale(`TRADE.ADD_SELECT_TIMEOUT`),
                                    components: []
                                }).catch(() => {})
                                return
                            }
                            const chosenItemId = parseInt(selectInteraction.values[0], 10)
                            const chosen = candidates.find(c => Number(c.item_id) === chosenItemId)
                            const owned = Number(chosen.quantity) || 0
                            //  Subtract whatever this side has already offered
                            //  for this item — that's the real ceiling we need
                            //  to enforce, not the raw inventory count.
                            const alreadyOffered = (session.snapshot().offers[side].items.find(l => Number(l.itemId) === chosenItemId) || { qty: 0 }).qty
                            const maxAddable = owned - alreadyOffered

                            //  Loop the qty modal up to 3 attempts. Each invalid
                            //  attempt re-shows a modal with the failure inline
                            //  in the title — Discord modals can't carry an
                            //  arbitrary banner, but the title is dynamic and is
                            //  the most visible thing the user reads. The
                            //  text-input label also surfaces the owned count
                            //  so the answer is right in front of them.
                            const qtyResult = await this.collectAddQuantity({
                                anchorInteraction: selectInteraction,
                                locale,
                                chosen,
                                maxAddable,
                                collector
                            })
                            if (qtyResult.timeout) {
                                await i.editReply({ content: locale(`TRADE.ADD_SELECT_TIMEOUT`), components: [] }).catch(() => {})
                                return
                            }
                            if (qtyResult.aborted) {
                                await i.editReply({ content: locale(`TRADE.ADD_TOO_MANY_RETRIES`), components: [] }).catch(() => {})
                                return
                            }
                            const { submission, qty } = qtyResult
                            try {
                                await session.addItem(side, { itemId: chosen.item_id, qty })
                            } catch (err) {
                                if (err instanceof TradeError) {
                                    const code = err.code
                                    if (code === `ITEM_NOT_TRADEABLE`) {
                                        await submission.reply({ content: locale(`TRADE.ITEM_NOT_TRADEABLE`).replace(`{{item}}`, chosen.name), flags: MessageFlags.Ephemeral })
                                    } else if (code === `INSUFFICIENT_ITEM`) {
                                        await submission.reply({
                                            content: locale(`TRADE.INSUFFICIENT_ITEM`)
                                                .replace(`{{user}}`, side === `a` ? initiator.username : target.username)
                                                .replace(`{{qty}}`, qty)
                                                .replace(`{{item}}`, chosen.name),
                                            flags: MessageFlags.Ephemeral
                                        })
                                    } else {
                                        await submission.reply({ content: locale(`TRADE.ITEM_NOT_FOUND`), flags: MessageFlags.Ephemeral })
                                    }
                                    return
                                }
                                throw err
                            }
                            await submission.deferUpdate().catch(() => {})
                            //  Tidy the ephemeral select prompt so it doesn't
                            //  hang around once the qty has landed.
                            await i.editReply({ content: locale(`TRADE.OFFER_LINE`).replace(`{{qty}}`, qty).replace(`{{item}}`, chosen.name), components: [] }).catch(() => {})
                            return await refreshUi()
                        }

                        case `trade:remove`: {
                            const offer = session.snapshot().offers[side].items
                            if (!offer.length) {
                                return i.reply({ content: locale(`TRADE.REMOVE_NO_ITEMS`), flags: MessageFlags.Ephemeral })
                            }
                            //  Simple shape: a modal asking for the item name +
                            //  qty, mirroring add. Keeps the surface symmetrical
                            //  and avoids select-menu pagination this PR.
                            const modalId = `trade:remove:${i.id}`
                            const itemInput = new TextInputBuilder()
                                .setCustomId(`item`)
                                .setLabel(locale(`TRADE.ADD_MODAL_ITEM_LABEL`))
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                            const qtyInput = new TextInputBuilder()
                                .setCustomId(`qty`)
                                .setLabel(locale(`TRADE.ADD_MODAL_QTY_LABEL`))
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                            const modal = new ModalBuilder()
                                .setCustomId(modalId)
                                .setTitle(locale(`TRADE.REMOVE_MODAL_TITLE`))
                                .addComponents(
                                    new ActionRowBuilder().addComponents(itemInput),
                                    new ActionRowBuilder().addComponents(qtyInput)
                                )
                            await i.showModal(modal)
                            collector.resetTimer()
                            const submission = await i.awaitModalSubmit({
                                time: 60 * 1000,
                                filter: s => s.customId === modalId
                            }).catch(() => null)
                            if (!submission) return
                            const itemKeyword = submission.fields.getTextInputValue(`item`).trim()
                            const rawQty = submission.fields.getTextInputValue(`qty`).trim()
                            const qty = trueInt(rawQty)
                            if (!qty || qty <= 0) {
                                await submission.reply({ content: locale(`TRADE.QTY_INVALID`), flags: MessageFlags.Ephemeral })
                                return
                            }
                            //  Resolve against the offer (not the inventory) so
                            //  we only touch what's actually being offered.
                            const offered = session.snapshot().offers[side].items
                            const resolved = await this.resolveItemFromOffer(client, messageRef.guild.id, offered, itemKeyword)
                            if (!resolved) {
                                await submission.reply({ content: locale(`TRADE.ITEM_NOT_FOUND`), flags: MessageFlags.Ephemeral })
                                return
                            }
                            session.removeItem(side, { itemId: resolved.item_id, qty })
                            await submission.deferUpdate().catch(() => {})
                            return await refreshUi()
                        }
                    }
                } catch (err) {
                    client.logger.error({ action: `trade_button_failed`, msg: err && err.message, stack: err && err.stack })
                    await i.reply({ content: locale(`TRADE.EXEC_FAILED_GENERIC`), flags: MessageFlags.Ephemeral }).catch(() => {})
                }
            })

            collector.on(`end`, async (_, reasonStr) => {
                clearFinalTimer()
                if (reasonStr === `done`) return  //  finishWith handled cleanup
                if (session.state === STATE.COMMITTED || session.state === STATE.FAILED) return
                session.cancel(`idle_timeout`)
                try { await tradeMessage.edit({ components: [] }) } catch (_) { /* deleted */ }
                await reply.send(locale(`TRADE.IDLE_TIMEOUT`)).catch(() => {})
                resolve()
            })
        })
    },

    /**
     * Drive the qty-input loop for the Add flow. Each invalid attempt
     * re-shows a modal with the failure inline in the title. Caps at
     * `maxAttempts` to avoid an unbounded loop if the user keeps
     * submitting garbage.
     *
     * The modal title is the only piece of dynamic surface a Discord
     * modal exposes after submit — Discord doesn't let us repaint the
     * label of a TextInputBuilder mid-flow because the modal is
     * re-rendered fresh on every showModal call. So we encode "your
     * last attempt was invalid because X" into the title and re-stamp
     * the input's label with the same owned count.
     *
     * Resolves to one of:
     *   { submission, qty }            valid; caller may proceed
     *   { timeout: true }              the user closed the modal / 60s elapsed
     *   { aborted: true }              maxAttempts exhausted with bad input
     *
     * @param {object} params
     * @param {import('discord.js').Interaction} params.anchorInteraction
     *   The interaction we showModal off of for the first attempt.
     * @param {Function} params.locale
     * @param {object} params.chosen   `{ item_id, name, quantity }`
     * @param {number} params.maxAddable Hard ceiling: owned minus already-offered.
     * @param {object} params.collector Parent button collector (we reset its idle timer).
     * @param {number} [params.maxAttempts=3]
     */
    async collectAddQuantity({ anchorInteraction, locale, chosen, maxAddable, collector, maxAttempts = 3 }) {
        let nextInteraction = anchorInteraction
        let attempt = 0
        while (attempt < maxAttempts) {
            attempt++
            const titleBase = `${locale(`TRADE.ADD_QTY_MODAL_TITLE`)} — ${chosen.name}`
            const title = attempt > 1
                //  Mirrors the previous failure into the modal title so the
                //  user sees why their last attempt was rejected.
                ? `${titleBase} · ${this.lastQtyErrorLabel}`
                : titleBase
            const modalId = `trade:add:qty:${nextInteraction.id}`
            const qtyInput = new TextInputBuilder()
                .setCustomId(`qty`)
                .setLabel(this.truncate(locale(`TRADE.ADD_QTY_LABEL_WITH_OWNED`).replace(`{{owned}}`, maxAddable), 45))
                .setPlaceholder(this.truncate(locale(`TRADE.ADD_QTY_PLACEHOLDER`).replace(`{{max}}`, maxAddable), 100))
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle(this.truncate(title, 45))
                .addComponents(new ActionRowBuilder().addComponents(qtyInput))
            await nextInteraction.showModal(modal)
            if (collector) collector.resetTimer()
            const submission = await nextInteraction.awaitModalSubmit({
                time: 60 * 1000,
                filter: s => s.customId === modalId
            }).catch(() => null)
            if (!submission) return { timeout: true }
            const raw = submission.fields.getTextInputValue(`qty`).trim()
            const qty = trueInt(raw)
            if (!qty || qty <= 0) {
                this.lastQtyErrorLabel = locale(`TRADE.ADD_QTY_ERROR_INVALID`)
                nextInteraction = submission
                continue
            }
            if (qty > maxAddable) {
                this.lastQtyErrorLabel = locale(`TRADE.ADD_QTY_ERROR_TOO_MANY`).replace(`{{max}}`, maxAddable)
                nextInteraction = submission
                continue
            }
            return { submission, qty }
        }
        return { aborted: true }
    },

    /**
     * Walk the user's inventory once, return only the entries that are
     * actually addable to a trade offer: positive quantity, not in_use, has
     * a row in `items` with bind starting with "y", and the item id is not
     * one of the excluded line items (artcoins / fragments / lucky_ticket).
     *
     * Capped at 25 because that's the hard ceiling for `StringSelectMenu`
     * options. If a future install has more than 25 tradeable items per
     * user, we'll need pagination on the select; today this is well within
     * what any guild has.
     *
     * @param {object} client
     * @param {string} guildId
     * @param {string} userId
     * @return {Promise<object[]>} candidate item rows (id + name + quantity)
     */
    async fetchTradeableInventory(client, guildId, userId) {
        const inventory = await client.db.userUtils.getUserInventory(userId, guildId)
        if (!inventory || !inventory.length) return []
        return inventory.filter(row => {
            if (!row || row.quantity == null || row.quantity <= 0) return false
            if (row.in_use && Number(row.in_use) === 1) return false
            if (NON_LINE_ITEM_IDS.has(Number(row.item_id))) return false
            const bind = typeof row.bind === `string` ? row.bind.toLowerCase() : ``
            if (!bind.startsWith(`y`)) return false
            //  Custom-item scope: items owned by another guild are not
            //  tradeable here. NULL owned_by_guild_id is a global item and
            //  passes.
            if (row.owned_by_guild_id && String(row.owned_by_guild_id) !== String(guildId)) return false
            return true
        })
    },

    /**
     * Trim a label to Discord's component limits without throwing on shorter
     * input. We use the same helper for select option labels (100), select
     * descriptions (100), and modal titles (45).
     */
    truncate(str = ``, max = 100) {
        const s = String(str)
        if (s.length <= max) return s
        return `${s.slice(0, Math.max(0, max - 1))}…`
    },

    /**
     * Best-match item lookup against the invoking user's tradeable inventory
     * for the current guild. Used by the `add` flow.
     */
    async resolveItemForUser(client, guildId, userId, keyword) {
        //  getUserInventory lives on UserUtils, not DatabaseUtils.
        const inventory = await client.db.userUtils.getUserInventory(userId, guildId)
        if (!inventory || !inventory.length) return null
        const candidates = inventory.filter(row => row.quantity > 0 && (!row.in_use || Number(row.in_use) === 0))
        if (!candidates.length) return null
        const byId = candidates.find(c => parseInt(c.item_id, 10) === parseInt(keyword, 10))
        if (byId) return byId
        const names = candidates.map(c => (c.name || ``).toLowerCase())
        const match = stringSimilarity.findBestMatch(keyword.toLowerCase(), names)
        if (match.bestMatch.rating >= 0.5) {
            return candidates.find(c => (c.name || ``).toLowerCase() === match.bestMatch.target) || null
        }
        return null
    },

    /**
     * Best-match against the *currently-offered* lines, not the user's full
     * inventory. Used by the `remove` flow so we don't accidentally resolve
     * to an item the user has but hasn't put on the table yet.
     */
    async resolveItemFromOffer(client, guildId, offeredLines, keyword) {
        if (!offeredLines || !offeredLines.length) return null
        //  We need item names — pull them from the items table for the offered ids.
        const items = []
        for (const line of offeredLines) {
            const rows = await client.db.shop.getItem(line.itemId, guildId)
            const row = Array.isArray(rows) ? rows[0] : rows
            if (row) items.push({ ...row, item_id: line.itemId })
        }
        if (!items.length) return null
        const byId = items.find(c => parseInt(c.item_id, 10) === parseInt(keyword, 10))
        if (byId) return byId
        const names = items.map(c => (c.name || ``).toLowerCase())
        const match = stringSimilarity.findBestMatch(keyword.toLowerCase(), names)
        if (match.bestMatch.rating >= 0.5) {
            return items.find(c => (c.name || ``).toLowerCase() === match.bestMatch.target) || null
        }
        return null
    },

    /**
     * Build the dual-pane embed showing both offers + ready states.
     * Pure render — does not mutate session.
     */
    async renderEmbed(client, locale, messageRef, session, initiator, target) {
        const snap = session.snapshot()
        const acEmoji = await client.getEmoji(this.ARTCOINS_EMOJI_ID)
        const renderSide = async (side, user) => {
            const offer = snap.offers[side]
            const lines = []
            for (const line of offer.items) {
                const rows = await client.db.shop.getItem(line.itemId, messageRef.guild.id)
                const row = Array.isArray(rows) ? rows[0] : rows
                const name = row && row.name ? row.name : `#${line.itemId}`
                lines.push(locale(`TRADE.OFFER_LINE`).replace(`{{qty}}`, line.qty).replace(`{{item}}`, name))
            }
            const itemsBlock = lines.length ? lines.join(`\n`) : locale(`TRADE.OFFER_EMPTY`)
            const acBlock = locale(`TRADE.OFFER_ARTCOINS`)
                .replace(`{{emoji}}`, acEmoji)
                .replace(`{{amount}}`, commanifier(offer.artcoins))
            const readyBlock = snap.ready[side] ? locale(`TRADE.READY_YES`) : locale(`TRADE.READY_NO`)
            return {
                name: user.username,
                value: `${itemsBlock}\n${acBlock}\n${readyBlock}`,
                inline: true
            }
        }
        const fields = [
            await renderSide(`a`, initiator),
            await renderSide(`b`, target)
        ]
        const headerHint = snap.state === STATE.READIED
            ? locale(`TRADE.FINAL_PROMPT`)
            : locale(`TRADE.ACTIVE_HINT`)
        return new EmbedBuilder()
            .setTitle(locale(`TRADE.ACTIVE_HEADER`).replace(`{{guildName}}`, messageRef.guild.name))
            .setDescription(headerHint)
            .addFields(fields)
            .setColor(snap.state === STATE.READIED ? `#90ee90` : `#ffc9e2`)
    },

    /**
     * Button row layout. Adds a Switch-side button only in self-trade mode
     * so a solo dev can flip which column the next click affects.
     */
    buildButtonRows(session) {
        const buttons = [
            new ButtonBuilder().setCustomId(`trade:add`).setLabel(`Add item`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`trade:remove`).setLabel(`Remove item`).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`trade:setac`).setLabel(`Set artcoins`).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`trade:ready`).setLabel(`Ready`).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`trade:cancel`).setLabel(`Cancel`).setStyle(ButtonStyle.Danger)
        ]
        if (session && session.isSelfTrade) {
            //  Discord caps a row at 5 buttons; we already have 5 above, so
            //  the switch goes on a second row. Side label tells the user
            //  which column the next click will modify.
            const switchLabel = `Switch (now: ${session.currentSide === `a` ? `A` : `B`})`
            const switchRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`trade:switch`).setLabel(switchLabel).setStyle(ButtonStyle.Secondary)
            )
            return [new ActionRowBuilder().addComponents(...buttons), switchRow]
        }
        return [new ActionRowBuilder().addComponents(...buttons)]
    }
}
