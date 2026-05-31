"use strict"
const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)

const tradeHistory = require(`../../src/commands/user/tradehistory`)
const enLocales = require(`../../src/locales/en.json`)

/**
 * /tradehistory is a thin paginator over `client.db.trades.getTradeHistory`.
 * The DB shape is exercised in tests/libs/trade.test.js (the recordTradeLog
 * round-trip). What's worth covering here is the rendering layer: the
 * pagination math, the committed vs failed branching, and the offer
 * compaction since none of that runs through the lib.
 *
 * The fill helper does `{{key}}` substitution on the text returned from
 * locale(). A naive identity stub (`key => key`) breaks here because the
 * "template" we hand fill() is the locale key itself, which has no
 * placeholders. Resolve via the real en.json to keep the tests useful.
 */

function locale(key) {
    const parts = key.split(`.`)
    let cursor = enLocales
    for (const p of parts) {
        if (!cursor || typeof cursor !== `object`) return key
        cursor = cursor[p]
    }
    return typeof cursor === `string` ? cursor : key
}

const acEmoji = `:ac:`

const target = { id: `userA`, username: `Alice` }

function commitRow(id, partnerId, sent, received) {
    return {
        trade_id: id,
        registered_at: new Date(`2026-05-30T12:00:00Z`),
        user_a_id: target.id,
        user_b_id: partnerId,
        a_offer: sent,
        b_offer: received,
        status: `committed`,
        failure_reason: null
    }
}

function failRow(id, partnerId, reason) {
    return {
        trade_id: id,
        registered_at: new Date(`2026-05-30T12:00:00Z`),
        user_a_id: target.id,
        user_b_id: partnerId,
        a_offer: { items: [], artcoins: 0 },
        b_offer: { items: [], artcoins: 0 },
        status: `failed`,
        failure_reason: reason
    }
}

describe(`/tradehistory paging`, () => {

    it(`splits rows into pages of pageSize`, () => {
        const rows = []
        for (let i = 1; i <= 12; i++) {
            rows.push(commitRow(i, `userB`, { items: [], artcoins: i * 100 }, { items: [], artcoins: 0 }))
        }
        const pages = tradeHistory.buildPages(rows, target, locale, acEmoji)
        //  pageSize is 5, so 12 rows → 3 pages (5, 5, 2).
        expect(pages).to.have.lengthOf(3)
        //  Each page ends with the footer marker resolved from the locale file.
        const footer = locale(`TRADEHISTORY.PAGE_FOOTER`)
        for (const p of pages) {
            expect(p.endsWith(footer)).to.equal(true)
        }
    })

    it(`returns a single page when rows fit`, () => {
        const rows = [commitRow(1, `userB`, { items: [], artcoins: 100 }, { items: [], artcoins: 0 })]
        const pages = tradeHistory.buildPages(rows, target, locale, acEmoji)
        expect(pages).to.have.lengthOf(1)
    })
})

describe(`/tradehistory entry rendering`, () => {

    it(`renders a committed row with sent / received from the target's perspective`, () => {
        //  Target is user_a, so 'sent' should be a_offer and 'received' b_offer.
        const row = commitRow(7, `userB`, { items: [{ itemId: 99, qty: 2 }], artcoins: 500 }, { items: [{ itemId: 88, qty: 1 }], artcoins: 0 })
        const out = tradeHistory.formatEntry(row, target, locale, acEmoji)
        expect(out).to.include(`#7`)
        expect(out).to.include(`<@userB>`)
        expect(out).to.include(`Alice`)
        //  Sent = a_offer (item 99 ×2 + 500 AC). Received = b_offer (item 88 ×1).
        expect(out).to.include(`2× #99`)
        expect(out).to.include(`500`)
        expect(out).to.include(`1× #88`)
    })

    it(`flips perspective when target is user_b`, () => {
        const row = {
            trade_id: 8,
            registered_at: new Date(`2026-05-30T12:00:00Z`),
            user_a_id: `userB`,
            user_b_id: target.id,                  //  target is on the B side
            a_offer: { items: [{ itemId: 11, qty: 1 }], artcoins: 0 },
            b_offer: { items: [{ itemId: 22, qty: 1 }], artcoins: 0 },
            status: `committed`,
            failure_reason: null
        }
        const out = tradeHistory.formatEntry(row, target, locale, acEmoji)
        //  Target sent b_offer (#22), received a_offer (#11).
        const sentIdx = out.indexOf(`1× #22`)
        const recvIdx = out.indexOf(`1× #11`)
        expect(sentIdx).to.be.greaterThan(-1)
        expect(recvIdx).to.be.greaterThan(-1)
        //  In TRADEHISTORY.ENTRY_COMMITTED, "sent" comes before "received".
        expect(sentIdx).to.be.lessThan(recvIdx)
    })

    it(`renders a failed row with status and reason`, () => {
        const row = failRow(9, `userB`, `INSUFFICIENT_ARTCOINS`)
        const out = tradeHistory.formatEntry(row, target, locale, acEmoji)
        expect(out).to.include(`#9`)
        expect(out).to.include(locale(`TRADEHISTORY.STATUS_FAILED`))
        expect(out).to.include(`INSUFFICIENT_ARTCOINS`)
    })
})

describe(`/tradehistory offer compaction`, () => {

    it(`compacts an offer with items + artcoins into a comma-separated line`, () => {
        const out = tradeHistory.formatOffer({ items: [{ itemId: 1, qty: 3 }, { itemId: 2, qty: 1 }], artcoins: 1500 }, locale, acEmoji)
        expect(out).to.include(`3× #1`)
        expect(out).to.include(`1× #2`)
        expect(out).to.include(`1,500`)
    })

    it(`returns the OFFER_NONE locale for an empty offer`, () => {
        expect(tradeHistory.formatOffer({ items: [], artcoins: 0 }, locale, acEmoji))
            .to.equal(locale(`TRADEHISTORY.OFFER_NONE`))
    })

    it(`parses jsonb that came back as a string`, () => {
        //  pg returns jsonb as parsed objects normally, but defensive code
        //  in production should still handle the string fallback. The
        //  formatter must not crash on either shape.
        const raw = JSON.stringify({ items: [{ itemId: 5, qty: 2 }], artcoins: 0 })
        const out = tradeHistory.formatOffer(raw, locale, acEmoji)
        expect(out).to.include(`2× #5`)
    })

    it(`treats malformed JSON as no offer`, () => {
        expect(tradeHistory.formatOffer(`not-json`, locale, acEmoji))
            .to.equal(locale(`TRADEHISTORY.OFFER_NONE`))
    })
})

describe(`/tradehistory metadata`, () => {

    it(`is registered on both rails at user permission`, () => {
        expect(tradeHistory.name).to.equal(`tradehistory`)
        expect(tradeHistory.applicationCommand).to.equal(true)
        expect(tradeHistory.messageCommand).to.equal(true)
        expect(tradeHistory.permissionLevel).to.equal(0)
    })

    it(`exposes an optional user option`, () => {
        expect(tradeHistory.options).to.have.lengthOf(1)
        expect(tradeHistory.options[0].name).to.equal(`user`)
        expect(tradeHistory.options[0].required).to.equal(false)
    })
})
