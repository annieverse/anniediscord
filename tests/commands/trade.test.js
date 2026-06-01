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
        //  but we can confirm the early-exit path doesn't trigger. Strategy:
        //  fail metadata fetch on purpose so runActiveSession bails through
        //  its own catch (logger.warn + session.cancel + releaseLocks). If
        //  the bypass had failed, run() would have replied SELF_TRADE and
        //  never touched the DB at all — caches.size would stay 0 with no
        //  logger.warn call. We assert the lock was acquired and released,
        //  AND that the metadata fetch was attempted.
        const caches = new Set()
        const warnings = []
        let metadataCallCount = 0
        const client = buildClient({
            logger: { info() {}, warn(payload) { warnings.push(payload) }, error() {}, debug() {} },
            db: {
                databaseUtils: {
                    async doesCacheExist(key) { return caches.has(key) },
                    async setCache(key) { caches.add(key) },
                    async delCache(key) { caches.delete(key) },
                    async validateUserEntry() {}
                },
                userUtils: {
                    async getUser() {
                        metadataCallCount++
                        throw new Error(`__metadata_probe__`)
                    }
                },
                guildUtils: {
                    async registerGuild() {}
                }
            }
        })
        const reply = buildReply()
        const locale = key => key
        const messageRef = fakeMessageRef()
        const target = { id: `userA`, username: `Alice`, bot: false }
        await tradeCommand.run(client, reply, messageRef, locale, target)
        //  The bypass was reached: run() got past the self-trade check, set
        //  the lock, called requestMetadata (which threw), caught it, and
        //  released the lock cleanly via finally.
        expect(metadataCallCount, `metadata fetch should have been attempted`).to.equal(1)
        expect(warnings.some(w => w && w.action === `trade_metadata_fetch_failed`)).to.equal(true)
        expect(caches.size, `lock released by finally`).to.equal(0)
        //  Crucially, no SELF_TRADE locale was sent — that's how we know the
        //  bypass actually worked rather than the gate firing.
        expect(reply.calls.find(c => c.content === `TRADE.SELF_TRADE`)).to.equal(undefined)
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
                userUtils: {
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

describe(`/trade fetchTradeableInventory`, () => {

    function clientWith(inventory) {
        return {
            db: {
                userUtils: { async getUserInventory() { return inventory } }
            }
        }
    }

    it(`returns rows that are tradeable, dropping bound, in_use, and zero-qty lines`, async () => {
        const client = clientWith([
            { item_id: 100, name: `Apple`, quantity: 5, in_use: 0, bind: `y` },           //  ok
            { item_id: 101, name: `Bound`, quantity: 5, in_use: 0, bind: `n` },           //  bound
            { item_id: 102, name: `Empty`, quantity: 0, in_use: 0, bind: `y` },           //  zero qty
            { item_id: 103, name: `Active`, quantity: 1, in_use: 1, bind: `y` },          //  in use
            { item_id: 104, name: `Legacy`, quantity: 1, in_use: 0, bind: null },         //  no bind metadata
        ])
        const result = await tradeCommand.fetchTradeableInventory(client, `g1`, `userA`)
        const ids = result.map(r => r.item_id)
        expect(ids).to.deep.equal([100])
    })

    it(`drops the excluded line items (artcoins, fragments, lucky tickets) regardless of bind`, async () => {
        const client = clientWith([
            { item_id: 52, name: `Artcoins`, quantity: 9999, in_use: 0, bind: `y` },
            { item_id: 51, name: `Fragments`, quantity: 200, in_use: 0, bind: `y` },
            { item_id: 71, name: `LuckyTicket`, quantity: 5, in_use: 0, bind: `y` },
            { item_id: 200, name: `Pear`, quantity: 3, in_use: 0, bind: `y` },
        ])
        const result = await tradeCommand.fetchTradeableInventory(client, `g1`, `userA`)
        expect(result.map(r => r.item_id)).to.deep.equal([200])
    })

    it(`scopes custom items by owned_by_guild_id`, async () => {
        const client = clientWith([
            { item_id: 300, name: `Local`, quantity: 1, in_use: 0, bind: `y`, owned_by_guild_id: `g1` },
            { item_id: 301, name: `Foreign`, quantity: 1, in_use: 0, bind: `y`, owned_by_guild_id: `g2` },
            { item_id: 302, name: `Global`, quantity: 1, in_use: 0, bind: `y`, owned_by_guild_id: null }
        ])
        const result = await tradeCommand.fetchTradeableInventory(client, `g1`, `userA`)
        expect(result.map(r => r.item_id).sort()).to.deep.equal([300, 302])
    })
})

describe(`/trade truncate`, () => {
    it(`leaves short strings alone and ellipsises overflowing ones`, () => {
        expect(tradeCommand.truncate(`abc`, 10)).to.equal(`abc`)
        expect(tradeCommand.truncate(`abcdefghij`, 10)).to.equal(`abcdefghij`)
        expect(tradeCommand.truncate(`abcdefghijk`, 10)).to.equal(`abcdefghi…`)
    })
})

describe(`/trade transient message cleanup`, () => {
    it(`deletes the active hint message after final confirmation`, async () => {
        const message = { delete: sinon.stub().resolves() }
        await tradeCommand.deleteMessage(message)
        expect(message.delete.calledOnce).to.equal(true)
    })

    it(`does not interrupt the trade when the hint message is already gone`, async () => {
        const message = { delete: sinon.stub().rejects(new Error(`Unknown Message`)) }
        await tradeCommand.deleteMessage(message)
        expect(message.delete.calledOnce).to.equal(true)
    })

    it(`accepts an empty hint response when sending the hint failed`, async () => {
        await tradeCommand.deleteMessage(null)
    })
})

describe(`/trade loading animation`, () => {
    it(`uses the profile loading emoji and removes the loader when window preparation fails`, async () => {
        const loading = { delete: sinon.stub().resolves() }
        const reply = { send: sinon.stub().resolves(loading) }
        const session = { accept: sinon.stub(), cancel: sinon.stub() }
        const client = buildClient({
            db: {
                guildUtils: {
                    async registerGuild() {}
                },
                userUtils: {
                    async getUser() {
                        throw new Error(`__metadata_probe__`)
                    }
                }
            }
        })
        const messageRef = {
            guild: { id: `g1` },
            member: { id: `userA` }
        }
        await tradeCommand.runActiveSession(
            client,
            reply,
            key => key,
            messageRef,
            session,
            { id: `userA`, username: `Alice` },
            { id: `userB`, username: `Bob` }
        )
        expect(session.accept.calledOnce).to.equal(true)
        expect(client.getEmoji.calledWith(`790994076257353779`)).to.equal(true)
        expect(reply.send.calledWith(`TRADE.FETCHING`, { socket: { emoji: `:emoji:` } })).to.equal(true)
        expect(session.cancel.calledWith(`metadata_fetch_failed`)).to.equal(true)
        expect(loading.delete.calledOnce).to.equal(true)
    })
})
