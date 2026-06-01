"use strict"
const { describe, it, beforeEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)

/**
 * `database.js` is a single file. `DatabaseUtils` is not exported, so reach it
 * via `Database.prototype.initializeDb` running against a stub PG/Redis client.
 * That way the tests don't need a live PG/Redis pair just to exercise the
 * conditional-debit primitive.
 */
const Database = require(`../../src/libs/database`)
const tmp = new Database({})
tmp.redis = {}
tmp.initializeDb()
const databaseUtilsPrototype = Object.getPrototypeOf(tmp.databaseUtils)

/**
 * Build a stand-in DatabaseUtils instance. Both methods under test only touch
 * `this._query`, `this.client.query`, and `this.formatFunctionLog`, so we can
 * stub all three without booting any real driver.
 */
function buildUtils() {
    const utils = Object.create(databaseUtilsPrototype)
    utils.fnClass = `DatabaseUtils`
    utils._query = sinon.stub()
    utils.client = { query: sinon.stub().resolves() }
    return utils
}

describe(`DatabaseUtils.spendInventory`, () => {
    let utils

    beforeEach(() => {
        utils = buildUtils()
    })

    it(`returns ok:true and the new balance when the conditional UPDATE matches`, async () => {
        utils._query.resolves({ rowCount: 1, rows: [{ quantity: `400` }], changes: 1 })
        const res = await utils.spendInventory({ itemId: 52, value: 600, userId: `u1`, guildId: `g1` })
        expect(res).to.deep.equal({ ok: true, remaining: 400 })
        expect(utils._query.calledOnce).to.equal(true)
        const [stmt, type, params] = utils._query.firstCall.args
        //  Predicate must live inside the same statement as the decrement, otherwise
        //  the race window we are trying to close stays open.
        expect(stmt).to.match(/quantity\s*>=\s*\$value/)
        expect(stmt).to.match(/quantity\s*=\s*quantity\s*-\s*\$value/)
        expect(type).to.equal(`run`)
        expect(params).to.deep.equal({ itemId: 52, userId: `u1`, guildId: `g1`, value: 600 })
    })

    it(`returns ok:false when no row matched (insufficient balance or missing row)`, async () => {
        utils._query.resolves({ rowCount: 0, rows: [], changes: 0 })
        const res = await utils.spendInventory({ itemId: 52, value: 1000, userId: `u1`, guildId: `g1` })
        expect(res).to.deep.equal({ ok: false, remaining: null })
    })

    it(`returns ok:false when _query swallows an error and resolves to undefined`, async () => {
        //  `_query` (database.js:173-175) currently emits and returns undefined on
        //  catch (#18). spendInventory must treat that as failure rather than letting
        //  callers proceed to credit the receiver.
        utils._query.resolves(undefined)
        const res = await utils.spendInventory({ itemId: 52, value: 100, userId: `u1`, guildId: `g1` })
        expect(res).to.deep.equal({ ok: false, remaining: null })
    })

    it(`rejects non-positive or non-finite values before hitting the DB`, async () => {
        for (const bad of [0, -1, NaN, Infinity, `5`, null, undefined]) {
            let threw = false
            try { await utils.spendInventory({ itemId: 52, value: bad, userId: `u1`, guildId: `g1` }) }
            catch (e) { threw = e instanceof RangeError || e instanceof TypeError }
            expect(threw, `value=${String(bad)} should throw`).to.equal(true)
        }
        expect(utils._query.called).to.equal(false)
    })

    it(`requires userId, itemId, and guildId`, async () => {
        const cases = [
            { itemId: 52, value: 1, userId: ``, guildId: `g1` },
            { itemId: 0, value: 1, userId: `u1`, guildId: `g1` },
            { itemId: 52, value: 1, userId: `u1`, guildId: `` }
        ]
        for (const c of cases) {
            let threw = false
            try { await utils.spendInventory(c) } catch (e) { threw = e instanceof TypeError }
            expect(threw).to.equal(true)
        }
    })

    it(`only one of two concurrent debits against the same row succeeds`, async () => {
        //  Simulate Postgres' row-level lock by serializing the two _query calls
        //  through a single shared "balance" cell. The first caller to reach the
        //  predicate sees enough quantity; the second sees zero.
        let balance = 1000
        utils._query.callsFake(async (_stmt, _type, params) => {
            if (balance >= params.value) {
                balance -= params.value
                return { rowCount: 1, rows: [{ quantity: String(balance) }], changes: 1 }
            }
            return { rowCount: 0, rows: [], changes: 0 }
        })
        const [a, b] = await Promise.all([
            utils.spendInventory({ itemId: 52, value: 1000, userId: `u1`, guildId: `g1` }),
            utils.spendInventory({ itemId: 52, value: 1000, userId: `u1`, guildId: `g1` })
        ])
        const winners = [a, b].filter(r => r.ok)
        const losers = [a, b].filter(r => !r.ok)
        expect(winners.length).to.equal(1)
        expect(losers.length).to.equal(1)
        expect(balance).to.equal(0)
    })
})

describe(`DatabaseUtils.transaction`, () => {
    let utils

    beforeEach(() => {
        utils = buildUtils()
    })

    it(`wraps fn in BEGIN/COMMIT and returns its result`, async () => {
        const fn = sinon.stub().resolves(`ok`)
        const result = await utils.transaction(fn)
        expect(result).to.equal(`ok`)
        const calls = utils.client.query.getCalls().map(c => c.args[0])
        expect(calls).to.deep.equal([`BEGIN`, `COMMIT`])
        expect(fn.calledOnce).to.equal(true)
    })

    it(`rolls back and rethrows when fn throws`, async () => {
        const boom = new Error(`debit-failed`)
        let caught
        try { await utils.transaction(async () => { throw boom }) } catch (e) { caught = e }
        expect(caught).to.equal(boom)
        const calls = utils.client.query.getCalls().map(c => c.args[0])
        expect(calls).to.deep.equal([`BEGIN`, `ROLLBACK`])
    })

    it(`still surfaces the original error if ROLLBACK itself fails`, async () => {
        utils.client.query
            .onFirstCall().resolves()
            .onSecondCall().rejects(new Error(`rollback-blew-up`))
        const boom = new Error(`debit-failed`)
        let caught
        try { await utils.transaction(async () => { throw boom }) } catch (e) { caught = e }
        //  The original error is what the caller cares about — losing it would mask
        //  the real failure mode and produce a confusing log.
        expect(caught).to.equal(boom)
    })

    it(`rejects a non-function fn before issuing BEGIN`, async () => {
        let caught
        try { await utils.transaction(`not-a-function`) } catch (e) { caught = e }
        expect(caught).to.be.instanceOf(TypeError)
        expect(utils.client.query.called).to.equal(false)
    })
})
