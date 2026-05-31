"use strict"
const { describe, it, beforeEach, afterEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)

const tradeCommand = require(`../../src/commands/user/trade`)
const { SESSION_LOCK_PREFIX } = require(`../../src/libs/trade`)

/**
 * The trade command is mostly Discord-component glue — the state machine
 * and atomic execution are covered exhaustively in tests/libs/trade.test.js.
 * What's still worth pinning here:
 *   - Command metadata shape (so the loader picks it up correctly)
 *   - Early-exit paths that never instantiate a TradeSession
 *   - The item-resolver helpers, which are the only command-level logic
 *     that doesn't run through the lib
 */

function buildClient(extras = {}) {
    return {
        prefix: `>`,
        logger: { info() {}, warn() {}, error() {}, debug() {} },
        getEmoji: sinon.stub().resolves(`:emoji:`),
        ...extras
    }
}

function buildReply() {
    const calls = []
    return {
        send: async (content, opts) => { calls.push({ content, opts }); return null },
        calls
    }
}

describe(`/trade command metadata`, () => {

    it(`is registered as both message and slash command at user permission`, () => {
        expect(tradeCommand.name).to.equal(`trade`)
        expect(tradeCommand.applicationCommand).to.equal(true)
        expect(tradeCommand.messageCommand).to.equal(true)
        expect(tradeCommand.permissionLevel).to.equal(0)
        expect(tradeCommand.server_specific).to.equal(false)
    })

    it(`exposes a single required user option for the slash variant`, () => {
        expect(tradeCommand.options).to.have.lengthOf(1)
        expect(tradeCommand.options[0].name).to.equal(`user`)
        expect(tradeCommand.options[0].required).to.equal(true)
    })
})

describe(`/trade run() early exits`, () => {

    function fakeMessageRef() {
        return {
            guild: { id: `g1`, name: `Test Guild` },
            member: { user: { id: `userA`, username: `Alice` } },
            //  runActiveSession sends the embed via channel.send directly
            //  (Response.send doesn't handle caller-supplied embeds), so the
            //  fake needs a channel object whose send hits our sentinel.
            channel: { send: async () => { throw new Error(`__reached_active__`) } }
        }
    }

    /**
     * Save the env vars we touch so each test can scope its mutations.
     * Skipping the bypass tests if NODE_ENV is somehow already set to
     * production while running locally — better to skip than to fight
     * an outer config the dev didn't expect.
     */
    let prevNodeEnv, prevBypass
    beforeEach(() => {
        prevNodeEnv = process.env.NODE_ENV
        prevBypass = process.env.BYPASS_SELF_TRADE
    })
    afterEach(() => {
        process.env.NODE_ENV = prevNodeEnv
        process.env.BYPASS_SELF_TRADE = prevBypass
    })

    it(`refuses self-trade with the SELF_TRADE locale`, async () => {
        delete process.env.BYPASS_SELF_TRADE
        process.env.NODE_ENV = `development`   //  one flag without the other must NOT bypass
        const client = buildClient()
        const reply = buildReply()
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `userA`, username: `Alice`, bot: false }
        await tradeCommand.run(client, reply, messageRef, locale, target)
        expect(reply.calls).to.have.lengthOf(1)
        expect(reply.calls[0].content).to.equal(`TRADE.SELF_TRADE`)
    })

    it(`still refuses self-trade when only BYPASS_SELF_TRADE is set`, async () => {
        delete process.env.NODE_ENV
        process.env.BYPASS_SELF_TRADE = `1`     //  needs NODE_ENV too
        const client = buildClient()
        const reply = buildReply()
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `userA`, username: `Alice`, bot: false }
        await tradeCommand.run(client, reply, messageRef, locale, target)
        expect(reply.calls).to.have.lengthOf(1)
        expect(reply.calls[0].content).to.equal(`TRADE.SELF_TRADE`)
    })

    it(`bypasses self-trade gate when both NODE_ENV=development and BYPASS_SELF_TRADE=1 are set`, async () => {
        process.env.NODE_ENV = `development`
        process.env.BYPASS_SELF_TRADE = `1`
        //  We can't drive the full Discord flow here without a real client,
        //  but we can confirm the early-exit path doesn't trigger. We stub
        //  the post-bypass calls so the flow short-circuits cleanly:
        //  requireBothFree must run without throwing, and we never reach
        //  the embed render.
        const caches = new Set()
        const client = buildClient({
            db: {
                databaseUtils: {
                    async doesCacheExist(key) { return caches.has(key) },
                    async setCache(key) { caches.add(key) },
                    async delCache(key) { caches.delete(key) }
                }
            }
        })
        //  Override reply.send so the moment runActiveSession tries to render
        //  the embed, we throw a sentinel error and unwind. That tells us we
        //  passed the gate without actually engaging the component collector.
        const reply = {
            send: async () => { throw new Error(`__reached_active__`) }
        }
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `userA`, username: `Alice`, bot: false }
        let caught
        try { await tradeCommand.run(client, reply, messageRef, locale, target) } catch (e) { caught = e }
        expect(caught, `should have reached the active-session render`).to.exist
        expect(caught.message).to.equal(`__reached_active__`)
        //  Only one lock should have been written (self-trade collapses both
        //  to the same user id).
        expect(caches.size).to.equal(0)  //  finally{} released it
    })

    it(`refuses bot trade partners`, async () => {
        const client = buildClient()
        const reply = buildReply()
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `bot1`, username: `BotUser`, bot: true }
        await tradeCommand.run(client, reply, messageRef, locale, target)
        expect(reply.calls).to.have.lengthOf(1)
        expect(reply.calls[0].content).to.equal(`TRADE.BOT_TRADE`)
    })

    it(`surfaces ALREADY_IN_TRADE when the partner is locked`, async () => {
        //  Stub out the bare minimum of client.db that requireBothFree needs.
        //  Lock for B is "set"; A is free. The command must short-circuit
        //  before acquireLocks runs (the stub here would no-op anyway).
        const caches = new Set([SESSION_LOCK_PREFIX + `userB`])
        const client = buildClient({
            db: {
                databaseUtils: {
                    async doesCacheExist(key) { return caches.has(key) },
                    async setCache() {},
                    async delCache(key) { caches.delete(key) }
                }
            }
        })
        const reply = buildReply()
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `userB`, username: `Bob`, bot: false }
        await tradeCommand.run(client, reply, messageRef, locale, target)
        const messages = reply.calls.map(c => c.content)
        expect(messages).to.include(`TRADE.ALREADY_IN_TRADE`)
        //  Whichever locale text was sent, the username substitution should
        //  have targeted the locked side (B).
        const lockedCall = reply.calls.find(c => c.content === `TRADE.ALREADY_IN_TRADE`)
        expect(lockedCall.opts.socket.user).to.equal(`Bob`)
    })
})

describe(`/trade item resolvers`, () => {

    function clientWithInventory(inventory, items = {}) {
        return {
            db: {
                databaseUtils: {
                    async getUserInventory() { return inventory }
                },
                shop: {
                    async getItem(itemId) {
                        return items[itemId] ? [items[itemId]] : null
                    }
                }
            }
        }
    }

    it(`resolveItemForUser matches by exact id first`, async () => {
        const client = clientWithInventory([
            { item_id: 100, name: `Apple`, quantity: 5, in_use: 0 },
            { item_id: 200, name: `Pear`, quantity: 3, in_use: 0 }
        ])
        const result = await tradeCommand.resolveItemForUser(client, `g1`, `userA`, `200`)
        expect(result.item_id).to.equal(200)
    })

    it(`resolveItemForUser falls back to fuzzy name match above 0.5 similarity`, async () => {
        const client = clientWithInventory([
            { item_id: 100, name: `Apple`, quantity: 5, in_use: 0 }
        ])
        const result = await tradeCommand.resolveItemForUser(client, `g1`, `userA`, `aple`)
        expect(result).to.not.equal(null)
        expect(result.item_id).to.equal(100)
    })

    it(`resolveItemForUser ignores in_use lines`, async () => {
        const client = clientWithInventory([
            { item_id: 100, name: `Apple`, quantity: 5, in_use: 1 }
        ])
        const result = await tradeCommand.resolveItemForUser(client, `g1`, `userA`, `apple`)
        expect(result).to.equal(null)
    })

    it(`resolveItemFromOffer only resolves against currently-offered lines`, async () => {
        const client = clientWithInventory([], {
            100: { item_id: 100, name: `Apple` }
        })
        const offered = [{ itemId: 100, qty: 2 }]
        const result = await tradeCommand.resolveItemFromOffer(client, `g1`, offered, `apple`)
        expect(result).to.not.equal(null)
        expect(result.item_id).to.equal(100)
        //  An item the user has but hasn't offered must not resolve.
        const empty = await tradeCommand.resolveItemFromOffer(client, `g1`, [], `apple`)
        expect(empty).to.equal(null)
    })
})
