"use strict"
const { describe, it, beforeEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)

const {
    TradeSession,
    TradeError,
    STATE,
    SESSION_LOCK_PREFIX,
    ARTCOINS_ITEM_ID
} = require(`../../src/libs/trade`)

/**
 * Build a stub `client.db` shaped just enough for TradeSession.
 *
 * `inventory` is keyed by `${userId}@${itemId}` and holds the current quantity.
 * Calls to spendInventory/updateInventory mutate it the same way the real PG
 * row would — that's what lets us assert post-execute state.
 *
 * `items` is keyed by itemId and carries `bind` and `owned_by_guild_id` so the
 * eligibility gate has something to chew on. Items not in the map come back as
 * null (mirrors `getItem` returning nothing).
 *
 * `caches` is the Redis stand-in for the session lock — same shape as
 * databaseUtils.{doesCacheExist,setCache,delCache} expects.
 */
function buildDb(seed = {}) {
    const inventory = new Map(Object.entries(seed.inventory || {}))
    const items = new Map(Object.entries(seed.items || {}).map(([k, v]) => [Number(k), v]))
    const caches = new Set()
    const tradeLog = []

    const databaseUtils = {
        async doesCacheExist(key) { return caches.has(key) },
        async setCache(key) { caches.add(key); return null },
        async delCache(key) { caches.delete(key); return null },

        async transaction(fn) {
            //  No-op shim; the harness assumes the throws inside fn correctly
            //  signal rollback, and the inventory map is the only state to
            //  unwind. We snapshot, run, restore on throw — same outcome
            //  Postgres ROLLBACK would produce.
            const snapshot = new Map(inventory)
            try { return await fn() } catch (e) {
                inventory.clear()
                for (const [k, v] of snapshot) inventory.set(k, v)
                throw e
            }
        },

        async spendInventory({ itemId, value, userId, guildId }) {
            const key = `${userId}@${itemId}@${guildId}`
            const current = inventory.get(key) || 0
            if (current < value) return { ok: false, remaining: null }
            inventory.set(key, current - value)
            return { ok: true, remaining: current - value }
        },

        async updateInventory({ itemId, value, operation, userId, guildId }) {
            const key = `${userId}@${itemId}@${guildId}`
            const current = inventory.get(key) || 0
            const sign = operation === `-` ? -1 : 1
            inventory.set(key, current + sign * value)
            return true
        }
    }

    const userUtils = {
        async getUserInventory(userId, guildId) {
            //  In production this method lives on UserUtils, not DatabaseUtils;
            //  the trade lib's #fetchOwnedQuantity calls it from there.
            const rows = []
            for (const [key, qty] of inventory) {
                const [u, i, g] = key.split(`@`)
                if (u === userId && g === guildId) {
                    rows.push({ user_id: u, item_id: Number(i), guild_id: g, quantity: qty, in_use: 0 })
                }
            }
            return rows
        }
    }

    const shop = {
        async getItem(itemId) {
            const item = items.get(Number(itemId))
            return item ? [item] : null
        }
    }

    const trades = {
        async recordTradeLog(payload) {
            const tradeId = tradeLog.length + 1
            tradeLog.push({ tradeId, ...payload })
            return { tradeId }
        }
    }

    return {
        db: { databaseUtils, userUtils, shop, trades },
        inventory,
        caches,
        tradeLog
    }
}

/**
 * Convenience: run a session through to ACTIVE state with the stub already
 * stocked from `seed`. Saves a half-dozen lines per test.
 */
async function buildActiveSession(seed = {}) {
    const ctx = buildDb(seed)
    const session = new TradeSession({
        db: ctx.db,
        guildId: `g1`,
        userAId: `userA`,
        userBId: `userB`
    })
    await session.requireBothFree()
    await session.acquireLocks()
    session.accept()
    return { ctx, session }
}

describe(`TradeSession state machine`, () => {

    it(`rejects self-trade at construction`, () => {
        let caught
        try {
            new TradeSession({
                db: buildDb().db,
                guildId: `g1`,
                userAId: `same`,
                userBId: `same`
            })
        } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TradeError)
        expect(caught.code).to.equal(`SELF_TRADE`)
    })

    it(`accepts self-trade when allowSelfTrade flag is set`, async () => {
        //  The escape hatch is gated at the *command* layer (NODE_ENV=development
        //  + BYPASS_SELF_TRADE=1). The lib only honors the explicit flag — it
        //  never reads env directly, so we can probe the constructor without
        //  setting any process.env values.
        const ctx = buildDb({
            inventory: { 'solo@200@g1': 5 },
            items: { 200: { item_id: 200, bind: `y` } }
        })
        const session = new TradeSession({
            db: ctx.db,
            guildId: `g1`,
            userAId: `solo`,
            userBId: `solo`,
            allowSelfTrade: true
        })
        expect(session.isSelfTrade).to.equal(true)
        expect(session.currentSide).to.equal(`a`)
        await session.requireBothFree()
        await session.acquireLocks()
        //  Only one Redis key is set, since A and B are the same user id.
        expect(ctx.caches.size).to.equal(1)
        expect(ctx.caches.has(SESSION_LOCK_PREFIX + `solo`)).to.equal(true)
        session.accept()
        await session.addItem(`a`, { itemId: 200, qty: 2 })
        //  The lib doesn't know which "side" the same user means; the command
        //  layer flips currentSide via the Switch button. We simulate that here.
        session.currentSide = `b`
        //  Both sides drawing from the same inventory: A reserved 2, so B
        //  can still take up to 3.
        await session.addItem(`b`, { itemId: 200, qty: 3 })
        const snap = session.snapshot()
        expect(snap.offers.a.items).to.deep.equal([{ itemId: 200, qty: 2 }])
        expect(snap.offers.b.items).to.deep.equal([{ itemId: 200, qty: 3 }])
        await session.releaseLocks()
        expect(ctx.caches.size).to.equal(0)
    })

    it(`acquires both locks on accept and releases them on cancel`, async () => {
        const { ctx, session } = await buildActiveSession()
        expect(ctx.caches.has(SESSION_LOCK_PREFIX + `userA`)).to.equal(true)
        expect(ctx.caches.has(SESSION_LOCK_PREFIX + `userB`)).to.equal(true)
        session.cancel(`user_cancel`)
        await session.releaseLocks()
        expect(ctx.caches.has(SESSION_LOCK_PREFIX + `userA`)).to.equal(false)
        expect(ctx.caches.has(SESSION_LOCK_PREFIX + `userB`)).to.equal(false)
        expect(session.state).to.equal(STATE.CANCELLED)
    })

    it(`refuses requireBothFree when either user is already in a session`, async () => {
        const ctx = buildDb()
        ctx.caches.add(SESSION_LOCK_PREFIX + `userB`)
        const session = new TradeSession({ db: ctx.db, guildId: `g1`, userAId: `userA`, userBId: `userB` })
        let caught
        try { await session.requireBothFree() } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TradeError)
        expect(caught.code).to.equal(`ALREADY_IN_TRADE`)
        //  Side detail tells the UI which user to name in the locale string.
        expect(caught.detail).to.equal(`b`)
    })

    it(`addItem rejects bound items, untradeable items, and other-guild custom items`, async () => {
        const seed = {
            inventory: {
                'userA@10@g1': 5,    //  bound
                'userA@11@g1': 5,    //  unset bind
                'userA@12@g1': 5,    //  custom item from a different guild
                'userA@13@g1': 5     //  excluded line item (artcoins-like)
            },
            items: {
                10: { item_id: 10, bind: `n` },
                11: { item_id: 11, bind: null },
                12: { item_id: 12, bind: `yes`, owned_by_guild_id: `OTHER_GUILD` },
                13: { item_id: 13, bind: `yes` }
            }
        }
        const { session } = await buildActiveSession(seed)

        const expectError = async (fn, code) => {
            let caught
            try { await fn() } catch (e) { caught = e }
            expect(caught, `expected ${code}`).to.be.instanceOf(TradeError)
            expect(caught.code).to.equal(code)
        }
        await expectError(() => session.addItem(`a`, { itemId: 10, qty: 1 }), `ITEM_NOT_TRADEABLE`)
        await expectError(() => session.addItem(`a`, { itemId: 11, qty: 1 }), `ITEM_NOT_TRADEABLE`)
        await expectError(() => session.addItem(`a`, { itemId: 12, qty: 1 }), `ITEM_NOT_TRADEABLE`)
        await expectError(() => session.addItem(`a`, { itemId: ARTCOINS_ITEM_ID, qty: 1 }), `ITEM_NOT_TRADEABLE`)
    })

    it(`addItem rejects requests above owned quantity, including stacked offers`, async () => {
        const seed = {
            inventory: { 'userA@20@g1': 3 },
            items: { 20: { item_id: 20, bind: `y` } }
        }
        const { session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 20, qty: 2 })  //  fine; 1 left
        let caught
        try { await session.addItem(`a`, { itemId: 20, qty: 2 }) } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TradeError)
        expect(caught.code).to.equal(`INSUFFICIENT_ITEM`)
        //  The earlier add should still have stuck.
        const snap = session.snapshot()
        expect(snap.offers.a.items).to.deep.equal([{ itemId: 20, qty: 2 }])
    })

    it(`setArtcoins rejects negative or non-integer values`, async () => {
        const { session } = await buildActiveSession()
        for (const bad of [-1, 1.5, NaN, `5`, null, undefined]) {
            let caught
            try { session.setArtcoins(`a`, bad) } catch (e) { caught = e }
            expect(caught, `value=${String(bad)}`).to.be.instanceOf(TradeError)
            expect(caught.code).to.equal(`AC_INVALID`)
        }
    })

    it(`enters READIED when both flags are true and reverts to ACTIVE on toggle`, async () => {
        const { session } = await buildActiveSession()
        session.setReady(`a`, true)
        expect(session.state).to.equal(STATE.ACTIVE)
        session.setReady(`b`, true)
        expect(session.state).to.equal(STATE.READIED)
        session.setReady(`b`, false)
        expect(session.state).to.equal(STATE.ACTIVE)
    })

    it(`clears both ready flags and reverts to ACTIVE when an offer mutates`, async () => {
        const seed = {
            inventory: { 'userA@30@g1': 5, 'userA@31@g1': 5 },
            items: {
                30: { item_id: 30, bind: `y` },
                31: { item_id: 31, bind: `y` }
            }
        }
        const { session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 30, qty: 1 })
        session.setReady(`a`, true)
        session.setReady(`b`, true)
        expect(session.state).to.equal(STATE.READIED)
        //  This is the modify-while-locked rule from §4: both readies clear,
        //  state snaps back to ACTIVE, but the new line still applies.
        await session.addItem(`a`, { itemId: 31, qty: 1 })
        expect(session.state).to.equal(STATE.ACTIVE)
        expect(session.snapshot().ready).to.deep.equal({ a: false, b: false })
        const items = session.snapshot().offers.a.items.map(l => l.itemId).sort()
        expect(items).to.deep.equal([30, 31])
    })

    it(`clears the partner's ready flag when only one side has readied (anti-sneak-edit)`, async () => {
        //  This is the scam vector: A readies first, then B silently swaps in
        //  a different item before readying. Without the always-clear rule,
        //  A's "true" stays and the next B-ready would commit a trade A
        //  never agreed to. The rule says: any offer mutation by anyone clears
        //  every ready flag, no matter the prior state.
        const seed = {
            inventory: { 'userA@30@g1': 5, 'userB@40@g1': 5 },
            items: {
                30: { item_id: 30, bind: `y` },
                40: { item_id: 40, bind: `y` }
            }
        }
        const { session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 30, qty: 1 })
        session.setReady(`a`, true)
        expect(session.snapshot().ready).to.deep.equal({ a: true, b: false })
        //  B mutates AFTER A readied. A's consent must be revoked.
        await session.addItem(`b`, { itemId: 40, qty: 1 })
        expect(session.snapshot().ready).to.deep.equal({ a: false, b: false })
        expect(session.state).to.equal(STATE.ACTIVE)
    })

    it(`clears all ready flags on artcoin mutations too`, async () => {
        const { session } = await buildActiveSession()
        session.setReady(`a`, true)
        expect(session.snapshot().ready.a).to.equal(true)
        session.setArtcoins(`b`, 100)
        expect(session.snapshot().ready).to.deep.equal({ a: false, b: false })
    })

    it(`removeItem clamps to zero and triggers the ready-revoke rule`, async () => {
        const seed = {
            inventory: { 'userA@40@g1': 5 },
            items: { 40: { item_id: 40, bind: `y` } }
        }
        const { session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 40, qty: 3 })
        session.setReady(`a`, true)
        session.setReady(`b`, true)
        session.removeItem(`a`, { itemId: 40, qty: 99 })
        expect(session.snapshot().offers.a.items).to.deep.equal([])
        expect(session.state).to.equal(STATE.ACTIVE)
        expect(session.snapshot().ready).to.deep.equal({ a: false, b: false })
    })

    it(`mutating after construction throws when not in REQUESTED -> ACTIVE pipeline`, async () => {
        const { session } = await buildActiveSession()
        session.cancel()
        let caught
        try { await session.addItem(`a`, { itemId: 1, qty: 1 }) } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TradeError)
        expect(caught.code).to.equal(`INVALID_STATE`)
    })
})

describe(`TradeSession.execute`, () => {

    let clock
    beforeEach(() => { clock = sinon.useFakeTimers() })
    afterEach(() => { clock.restore() })

    it(`commits when both sides have everything they offered`, async () => {
        const seed = {
            inventory: {
                'userA@100@g1': 5,
                'userA@52@g1': 1000,
                'userB@200@g1': 3,
                'userB@52@g1': 0
            },
            items: {
                100: { item_id: 100, bind: `y` },
                200: { item_id: 200, bind: `y` }
            }
        }
        const { ctx, session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 100, qty: 2 })
        session.setArtcoins(`a`, 500)
        await session.addItem(`b`, { itemId: 200, qty: 1 })
        session.setReady(`a`, true)
        session.setReady(`b`, true)

        const result = await session.execute()
        expect(result.ok).to.equal(true)
        expect(result.tradeId).to.be.a(`number`)
        //  A loses 2× item 100 and 500 AC; B loses 1× item 200; credits mirror.
        expect(ctx.inventory.get(`userA@100@g1`)).to.equal(3)
        expect(ctx.inventory.get(`userA@52@g1`)).to.equal(500)
        expect(ctx.inventory.get(`userA@200@g1`)).to.equal(1)
        expect(ctx.inventory.get(`userB@100@g1`)).to.equal(2)
        expect(ctx.inventory.get(`userB@200@g1`)).to.equal(2)
        expect(ctx.inventory.get(`userB@52@g1`)).to.equal(500)
        expect(ctx.tradeLog).to.have.lengthOf(1)
        expect(ctx.tradeLog[0].status).to.equal(`committed`)
    })

    it(`rolls back every prior debit when a later debit fails`, async () => {
        //  A offers an item it owns, then offers more AC than it has. The
        //  first debit (item) lands; the AC debit returns ok:false, the
        //  transaction throws, the snapshot restore unwinds the item debit.
        //  No credits should run.
        const seed = {
            inventory: {
                'userA@100@g1': 5,
                'userA@52@g1': 100,         //  not enough for the 500 AC offer
                'userB@200@g1': 3
            },
            items: {
                100: { item_id: 100, bind: `y` },
                200: { item_id: 200, bind: `y` }
            }
        }
        const { ctx, session } = await buildActiveSession(seed)
        await session.addItem(`a`, { itemId: 100, qty: 2 })
        session.setArtcoins(`a`, 500)
        await session.addItem(`b`, { itemId: 200, qty: 1 })
        session.setReady(`a`, true)
        session.setReady(`b`, true)

        const result = await session.execute()
        expect(result.ok).to.equal(false)
        expect(result.code).to.equal(`INSUFFICIENT_ARTCOINS`)
        //  No credits ran on either side; A's item count untouched.
        expect(ctx.inventory.get(`userA@100@g1`)).to.equal(5)
        expect(ctx.inventory.get(`userA@52@g1`)).to.equal(100)
        expect(ctx.inventory.get(`userB@200@g1`)).to.equal(3)
        expect(ctx.inventory.get(`userB@100@g1`)).to.equal(undefined)
        expect(ctx.inventory.get(`userA@200@g1`)).to.equal(undefined)
        //  Failure log is best-effort outside the transaction.
        expect(ctx.tradeLog).to.have.lengthOf(1)
        expect(ctx.tradeLog[0].status).to.equal(`failed`)
        expect(session.state).to.equal(STATE.FAILED)
    })

    it(`refuses to execute outside READIED`, async () => {
        const { session } = await buildActiveSession()
        let caught
        try { await session.execute() } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TradeError)
        expect(caught.code).to.equal(`NOT_READIED`)
    })
})
