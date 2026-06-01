"use strict"
const GUI = require(`../../ui/prebuild/ownerHeader`)
const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { isInteractionCallbackResponse } = require(`../../utils/appCmdHelp`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const { ARTCOINS_ITEM_ID } = require(`../../libs/trade`)

/**
 * Views a user's recent trade history.
 * @author klerikdust
 */
module.exports = {
    name: `tradehistory`,
    aliases: [`tradehistory`, `tradelogs`, `tradelog`, `trades`],
    description: `View your recent trade history`,
    usage: `tradehistory <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    server_specific: false,
    options: [{
        name: `user`,
        description: `User you wish to see history of (default: yourself)`,
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    limitPerPage: 3,
    historyLimit: 50,
    ARTCOINS_EMOJI_ID: `758720612087627787`,

    async execute(client, reply, message, arg, locale, prefix) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale(`USER.IS_INVALID`))
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        return await this.run(client, reply, message, locale, targetUser, prefix)
    },

    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(client, reply, interaction, locale, options.getUser(`user`) || interaction.member.user, `/`)
    },

    async run(client, reply, messageRef, locale, user, prefix) {
        const userLib = new User(client, messageRef)
        if (!user) return await reply.send(locale(`USER.IS_INVALID`))
        const targetUserData = await userLib.requestMetadata(user, 2, locale)
        const rows = await client.db.trades.getTradeHistory(user.id, { limit: this.historyLimit, offset: 0 })
        const INVALID_HISTORY = userLib.isSelf(user.id) ? locale(`TRADEHISTORY.AUTHOR_EMPTY`) : locale(`TRADEHISTORY.OTHER_USER_EMPTY`)
        if (!rows || rows.length <= 0) return await reply.send(INVALID_HISTORY, { socket: { user: user.username } })
        return await reply.send(locale(`TRADEHISTORY.FETCHING`), { socket: { emoji: await client.getEmoji(`AAUloading`) } })
            .then(async loading => {
                const partnerLabels = await this.resolvePartnerLabels(rows, user, messageRef.guild)
                const pages = this.buildPages(rows, user, locale, await client.getEmoji(this.ARTCOINS_EMOJI_ID), partnerLabels)
                await reply.send(pages, {
                    prebuffer: true,
                    image: await new GUI(targetUserData).build(),
                    paging: true,
                    customHeader: [`${user.username}'s Trade History!`, user.displayAvatarURL()]
                })
                if (userLib.isSelf(user.id)) await reply.send(locale(`TRADEHISTORY.AUTHOR_TIPS`), {
                    simplified: true,
                    socket: {
                        prefix: prefix,
                        emoji: await client.getEmoji(`848521358236319796`)
                    }
                })
                return isInteractionCallbackResponse(loading) ? loading.resource.message.delete() : loading.delete()
            })
    },

    /**
     * Slice the rows into inventory-style pages.
     */
    buildPages(rows, user, locale, acEmoji, partnerLabels = {}) {
        const pages = []
        let str = ``
        let breakpoint = 0
        for (let i = 0; i < rows.length; i++) {
            if (breakpoint < 1) {
                str += `╭*:;,．★ ～☆*───────╮\n`
            }
            breakpoint++
            str += this.formatEntry(rows[i], user, locale, acEmoji, partnerLabels)
            if (breakpoint >= this.limitPerPage || i === (rows.length - 1)) {
                str = str.substring(0, str.length - 1)
                str += `╰────────☆～*:;,．*╯`
                breakpoint = 0
                pages.push(str)
                str = ``
            }
        }
        return pages
    },

    /**
     * Resolve active guild members to usernames, falling back to their ids
     * when they are no longer available in the server.
     */
    async resolvePartnerLabels(rows, user, guild) {
        const labels = {}
        const partnerIds = new Set(rows.map(row => {
            const isTargetUserA = String(row.user_a_id) === String(user.id)
            return String(isTargetUserA ? row.user_b_id : row.user_a_id)
        }))
        await Promise.all([...partnerIds].map(async partnerId => {
            let member = guild && guild.members && guild.members.cache
                ? guild.members.cache.get(partnerId)
                : null
            if (!member && guild && guild.members && guild.members.fetch) {
                try {
                    member = await guild.members.fetch(partnerId)
                } catch (_) {
                    member = null
                }
            }
            labels[partnerId] = member && member.user && member.user.username
                ? member.user.username
                : partnerId
        }))
        return labels
    },

    /**
     * Render a single trade from the target user's perspective.
     */
    formatEntry(row, user, locale, acEmoji, partnerLabels = {}) {
        const tradeId = row.trade_id
        const when = moment(row.registered_at).fromNow()
        const isTargetUserA = String(row.user_a_id) === String(user.id)
        const partnerId = isTargetUserA ? row.user_b_id : row.user_a_id
        if (row.status === `committed`) {
            const sent = isTargetUserA ? row.a_offer : row.b_offer
            const received = isTargetUserA ? row.b_offer : row.a_offer
            return this.fill(locale(`TRADEHISTORY.ENTRY_COMMITTED`), {
                tradeId: tradeId,
                when: when,
                partner: partnerLabels[partnerId] || partnerId,
                status: locale(`TRADEHISTORY.STATUS_COMMITTED`),
                sent: this.formatOffer(sent, locale, acEmoji),
                received: this.formatOffer(received, locale, acEmoji)
            })
        }
        const statusKey = row.status === `failed`
            ? locale(`TRADEHISTORY.STATUS_FAILED`)
            : locale(`TRADEHISTORY.STATUS_CANCELLED`)
        return this.fill(locale(`TRADEHISTORY.ENTRY_FAILED`), {
            tradeId: tradeId,
            when: when,
            status: statusKey,
            partner: partnerLabels[partnerId] || partnerId,
            reason: row.failure_reason || locale(`TRADEHISTORY.UNKNOWN_REASON`)
        })
    },

    /**
     * Compact one offer into a one-line string.
     */
    formatOffer(offer, locale, acEmoji) {
        if (!offer) return locale(`TRADEHISTORY.OFFER_NONE`)
        const parsed = typeof offer === `string` ? safeParse(offer) : offer
        if (!parsed) return locale(`TRADEHISTORY.OFFER_NONE`)
        const parts = []
        if (Array.isArray(parsed.items)) {
            for (const line of parsed.items) {
                parts.push(this.fill(locale(`TRADEHISTORY.OFFER_ITEM`), {
                    qty: commanifier(line.qty),
                    itemId: line.itemId
                }))
            }
        }
        if (parsed.artcoins && Number(parsed.artcoins) > 0) {
            parts.push(this.fill(locale(`TRADEHISTORY.OFFER_ARTCOINS`), {
                emoji: acEmoji,
                amount: commanifier(parsed.artcoins)
            }))
        }
        return parts.length ? parts.join(`, `) : locale(`TRADEHISTORY.OFFER_NONE`)
    },

    /**
     * Apply socket-style substitutions to a locale string.
     */
    fill(template, data) {
        let out = template
        for (const key in data) {
            out = out.split(`{{${key}}}`).join(String(data[key]))
        }
        return out
    },

    /** Re-exported for tests. */
    ARTCOINS_ITEM_ID
}

function safeParse(s) {
    try { return JSON.parse(s) } catch (_) { return null }
}
