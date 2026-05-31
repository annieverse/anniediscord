"use strict"
const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
const { ARTCOINS_ITEM_ID } = require(`../../libs/trade`)

/**
 * View a user's recent trade history. Default target is the invoker; an
 * optional User option lets people peek at someone else's record.
 *
 * Backed by `client.db.trades.getTradeHistory(userId, {limit, offset})` which
 * surfaces rows where the user appeared as either party. Renders through the
 * Response paging module so each page is a single self-contained string,
 * mirroring `remind.js` (closest analog in the existing codebase).
 *
 * Failed and cancelled rows are surfaced too, with an italic status note,
 * so users can self-diagnose "I clicked confirm and nothing happened" cases
 * before they file a support ticket.
 *
 * @link docs/trade-system-design.md §3.2, §10
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
    pageSize: 5,
    historyLimit: 50,
    ARTCOINS_EMOJI_ID: `758720612087627787`,
    HEADER_EMOJI_ID: `692428692999241771`,

    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let target
        if (arg) {
            const lookup = await userLib.lookFor(arg)
            if (!lookup) return await reply.send(locale(`USER.IS_INVALID`))
            target = lookup.master || lookup
        } else {
            target = message.author
        }
        return await this.run(client, reply, locale, target, client.prefix)
    },

    async Iexecute(client, reply, interaction, options, locale) {
        const target = options.getUser(`user`) || interaction.member.user
        return await this.run(client, reply, locale, target, `/`)
    },

    async run(client, reply, locale, target, prefix) {
        const rows = await client.db.trades.getTradeHistory(target.id, { limit: this.historyLimit, offset: 0 })
        if (!rows || rows.length === 0) {
            return await reply.send(locale(`TRADEHISTORY.EMPTY`), {
                socket: { user: target.username }
            })
        }
        const acEmoji = await client.getEmoji(this.ARTCOINS_EMOJI_ID)
        const headerEmoji = await client.getEmoji(this.HEADER_EMOJI_ID)
        const pages = this.buildPages(rows, target, locale, acEmoji)
        //  Prepend the intro line to the first page so paginator headers stay
        //  consistent with the rest of the codebase (remind.js does the same).
        pages[0] = this.fill(locale(`TRADEHISTORY.INTRO`), {
            emoji: headerEmoji,
            user: target.username,
            size: rows.length
        }) + pages[0]
        return await reply.send(pages, {
            paging: true,
            socket: { prefix: prefix }
        })
    },

    /**
     * Slice the rows into N-row pages, each rendered as one string.
     */
    buildPages(rows, target, locale, acEmoji) {
        const pages = []
        let buffer = ``
        let count = 0
        for (let i = 0; i < rows.length; i++) {
            buffer += this.formatEntry(rows[i], target, locale, acEmoji)
            count++
            const lastOnPage = count >= this.pageSize || i === rows.length - 1
            if (lastOnPage) {
                buffer += locale(`TRADEHISTORY.PAGE_FOOTER`)
                pages.push(buffer)
                buffer = ``
                count = 0
            } else {
                buffer += locale(`TRADEHISTORY.ENTRY_DIVIDER`)
            }
        }
        return pages
    },

    /**
     * Render a single row. Splits committed vs failed/cancelled because the
     * data we care to surface differs (offers vs failure_reason).
     */
    formatEntry(row, target, locale, acEmoji) {
        const tradeId = row.trade_id
        const when = moment(row.registered_at).fromNow()
        const isTargetUserA = String(row.user_a_id) === String(target.id)
        const partnerId = isTargetUserA ? row.user_b_id : row.user_a_id
        if (row.status === `committed`) {
            const sent = isTargetUserA ? row.a_offer : row.b_offer
            const received = isTargetUserA ? row.b_offer : row.a_offer
            return this.fill(locale(`TRADEHISTORY.ENTRY_COMMITTED`), {
                tradeId: tradeId,
                when: when,
                partner: `<@${partnerId}>`,
                user: target.username,
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
            partner: `<@${partnerId}>`,
            reason: row.failure_reason || `unknown`
        })
    },

    /**
     * Compact one offer into a one-line string. Items are listed by id since
     * names would require a per-row item lookup (50 rows × N lines = lots of
     * roundtrips on a history view). The trade itself uses names; the log
     * view trades resolution for speed.
     */
    formatOffer(offer, locale, acEmoji) {
        if (!offer) return locale(`TRADEHISTORY.OFFER_NONE`)
        const parsed = typeof offer === `string` ? safeParse(offer) : offer
        if (!parsed) return locale(`TRADEHISTORY.OFFER_NONE`)
        const parts = []
        if (Array.isArray(parsed.items)) {
            for (const line of parsed.items) {
                parts.push(this.fill(locale(`TRADEHISTORY.OFFER_ITEM`), {
                    qty: line.qty,
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
     * Local copy of the same `{{key}}` substitution helper `remind.js` uses;
     * keeps this file standalone without reaching into another command.
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
