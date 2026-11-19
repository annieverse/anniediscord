"use strict"
const { describe, it, beforeEach, afterEach } = require(`mocha`)
const { expect } = require(`chai`)
const { EventEmitter } = require(`events`)
const http = require(`http`)
const express = require(`express`)
const WebSocket = require(`ws`)

const { collectShardStatus, describeShard } = require(`../../src/api/lib/shardStatus`)
const requireLoopback = require(`../../src/api/middleware/requireLoopback`)
const { checkAuthorizationHeader } = require(`../../src/api/middleware/requirePrivateApiToken`)
const attachShardStream = require(`../../src/api/realtime/shardStream`)
const v1Router = require(`../../src/api/routes/v1`)
const shardNames = require(`../../src/config/shardName.json`)

const TOKEN = `unit-test-token`
const logger = { debug() {}, error() {}, warn() {}, info() {} }

/**
 * Fake `Shard`: an event emitter whose `eval` resolves with what the real
 * probe would return from inside the shard process.
 */
function fakeShard(id, evalImpl) {
    const shard = new EventEmitter()
    shard.id = id
    shard.eval = evalImpl
    return shard
}

function healthyShard(id, { ping = 40, guilds = 100, ready = true } = {}) {
    return fakeShard(id, async () => ({
        ready,
        gatewayPingMs: ping,
        guildCount: guilds,
        uptimeMs: 60000,
        eventProcessingLocked: false
    }))
}

/**
 * Fake `ShardingManager` holding the given shards.
 */
function fakeManager(shards, totalShards = shards.length) {
    const manager = new EventEmitter()
    manager.shards = new Map(shards.map(shard => [shard.id, shard]))
    manager.totalShards = totalShards
    return manager
}

function stubReqRes({ headers = {}, params = {}, remoteAddress = `127.0.0.1` } = {}) {
    let statusCode = 0
    let body = null
    return {
        req: {
            get: (key) => headers[key.toLowerCase()] || null,
            headers,
            params,
            path: `/shards`,
            socket: { remoteAddress }
        },
        res: {
            status(code) { statusCode = code; return this },
            json(payload) { body = payload; return this },
            set() { return this }
        },
        snapshot: () => ({ statusCode, body })
    }
}

function routeHandler(router, routePath) {
    const layer = router.stack.find(l => l.route && l.route.path === routePath)
    expect(layer, `expected ${routePath} route to be registered`).to.exist
    return layer.route.stack[0].handle
}

describe(`api/v1 shardStatus`, () => {
    it(`describes a shard by id, one-based number and codename`, () => {
        expect(describeShard(0)).to.deep.equal({ id: 0, number: 1, codename: shardNames[0], label: `0/${shardNames[0]}` })
        expect(describeShard(2).number).to.equal(3)
        expect(describeShard(2).codename).to.equal(shardNames[2])
    })

    it(`reports ping, retrieval latency and guild totals for every shard`, async () => {
        const manager = fakeManager([healthyShard(1, { ping: 60, guilds: 250 }), healthyShard(0, { ping: 40.4, guilds: 100 })])
        const snapshot = await collectShardStatus(manager)
        expect(snapshot.totalShards).to.equal(2)
        expect(snapshot.spawnedShards).to.equal(2)
        expect(snapshot.onlineShards).to.equal(2)
        expect(snapshot.totalGuilds).to.equal(350)
        expect(snapshot.averageGatewayPingMs).to.equal(50)
        expect(snapshot.retrievalLatencyMs).to.be.a(`number`)
        expect(snapshot.shards.map(s => s.id)).to.deep.equal([0, 1])
        const [first] = snapshot.shards
        expect(first).to.include({ id: 0, number: 1, codename: shardNames[0], status: `online`, gatewayPingMs: 40, guildCount: 100 })
        expect(first.retrievalLatencyMs).to.be.at.least(0)
    })

    it(`keeps the snapshot when one shard is dead`, async () => {
        const dead = fakeShard(1, () => Promise.reject(new Error(`Shard 1 has no active process or worker.`)))
        const snapshot = await collectShardStatus(fakeManager([healthyShard(0, { guilds: 7 }), dead]))
        expect(snapshot.onlineShards).to.equal(1)
        expect(snapshot.totalGuilds).to.equal(7)
        expect(snapshot.shards[1]).to.include({ status: `unavailable`, gatewayPingMs: null, guildCount: 0 })
        expect(snapshot.shards[1].error).to.match(/no active process/)
    })

    it(`marks a shard that never answers as unavailable after the timeout`, async () => {
        const hung = fakeShard(0, () => new Promise(() => {}))
        const snapshot = await collectShardStatus(fakeManager([hung]), { timeoutMs: 20 })
        expect(snapshot.shards[0].status).to.equal(`unavailable`)
        expect(snapshot.shards[0].error).to.equal(`shard_probe_timeout`)
    })

    it(`reports a shard that answers before it is ready as connecting, with no ping yet`, async () => {
        const snapshot = await collectShardStatus(fakeManager([healthyShard(0, { ready: false, ping: -1 })], `auto`))
        expect(snapshot.shards[0].status).to.equal(`connecting`)
        expect(snapshot.shards[0].gatewayPingMs).to.equal(null)
        expect(snapshot.averageGatewayPingMs).to.equal(null)
        //  `totalShards` is the string 'auto' until the manager has spawned.
        expect(snapshot.totalShards).to.equal(1)
    })
})

describe(`api requireLoopback`, () => {
    it(`recognises IPv4, IPv6 and IPv4-mapped loopback addresses only`, () => {
        expect(requireLoopback.isLoopbackAddress(`127.0.0.1`)).to.equal(true)
        expect(requireLoopback.isLoopbackAddress(`::1`)).to.equal(true)
        expect(requireLoopback.isLoopbackAddress(`::ffff:127.0.0.1`)).to.equal(true)
        expect(requireLoopback.isLoopbackAddress(`192.168.1.10`)).to.equal(false)
        expect(requireLoopback.isLoopbackAddress(`::ffff:10.0.0.5`)).to.equal(false)
        expect(requireLoopback.isLoopbackAddress(undefined)).to.equal(false)
    })

    it(`lets a same-host request through`, () => {
        const { req, res } = stubReqRes()
        let passed = false
        requireLoopback({ logger })(req, res, () => { passed = true })
        expect(passed).to.equal(true)
    })

    it(`refuses a remote address with 403`, () => {
        const { req, res, snapshot } = stubReqRes({ remoteAddress: `203.0.113.9` })
        let passed = false
        requireLoopback({ logger })(req, res, () => { passed = true })
        expect(passed).to.equal(false)
        expect(snapshot()).to.deep.equal({ statusCode: 403, body: { ok: false, error: `local_requests_only` } })
    })

    it(`refuses a request relayed by a local reverse proxy`, () => {
        const { req, res, snapshot } = stubReqRes({ headers: { 'x-forwarded-for': `203.0.113.9` } })
        requireLoopback({ logger })(req, res, () => {})
        expect(snapshot().statusCode).to.equal(403)
    })
})

describe(`api checkAuthorizationHeader`, () => {
    let previous
    beforeEach(() => { previous = process.env.PRIVATE_API_TOKEN })
    afterEach(() => {
        if (previous === undefined) delete process.env.PRIVATE_API_TOKEN
        else process.env.PRIVATE_API_TOKEN = previous
    })

    it(`answers 503 while no token is configured`, () => {
        delete process.env.PRIVATE_API_TOKEN
        expect(checkAuthorizationHeader(`Bearer ${TOKEN}`)).to.include({ ok: false, status: 503, error: `private_api_unconfigured` })
    })

    it(`accepts only the configured bearer token`, () => {
        process.env.PRIVATE_API_TOKEN = TOKEN
        expect(checkAuthorizationHeader(`Bearer ${TOKEN}`).ok).to.equal(true)
        expect(checkAuthorizationHeader(undefined)).to.include({ ok: false, status: 401, error: `missing_bearer_token` })
        expect(checkAuthorizationHeader(`Bearer nope`)).to.include({ ok: false, status: 401, error: `invalid_token` })
    })
})

describe(`api/v1 GET /shards`, () => {
    it(`returns the live snapshot`, async () => {
        const router = v1Router({ logger, basePath: `/api`, manager: fakeManager([healthyShard(0, { guilds: 12 })]) })
        const { req, res, snapshot } = stubReqRes()
        await routeHandler(router, `/shards`)(req, res)
        const { statusCode, body } = snapshot()
        expect(statusCode).to.equal(200)
        expect(body.ok).to.equal(true)
        expect(body.totalGuilds).to.equal(12)
        expect(body.shards).to.have.lengthOf(1)
    })

    it(`answers 503 when no sharding manager was handed to the API`, async () => {
        const router = v1Router({ logger, basePath: `/api` })
        const { req, res, snapshot } = stubReqRes()
        await routeHandler(router, `/shards`)(req, res)
        expect(snapshot()).to.deep.equal({ statusCode: 503, body: { ok: false, error: `shard_manager_unavailable` } })
    })

    it(`serves a single shard by id and rejects unknown or malformed ids`, async () => {
        const router = v1Router({ logger, basePath: `/api`, manager: fakeManager([healthyShard(0), healthyShard(1)]) })
        const handler = routeHandler(router, `/shards/:id`)

        const found = stubReqRes({ params: { id: `1` } })
        await handler(found.req, found.res)
        expect(found.snapshot().statusCode).to.equal(200)
        expect(found.snapshot().body.shard).to.include({ id: 1, number: 2, codename: shardNames[1] })

        const missing = stubReqRes({ params: { id: `9` } })
        await handler(missing.req, missing.res)
        expect(missing.snapshot().statusCode).to.equal(404)

        const malformed = stubReqRes({ params: { id: `abc` } })
        await handler(malformed.req, malformed.res)
        expect(malformed.snapshot().statusCode).to.equal(400)
    })

    it(`gates every /shards route behind the loopback check`, () => {
        const router = v1Router({ logger, basePath: `/api`, manager: fakeManager([]) })
        const gateIndex = router.stack.findIndex(l => l.name === `loopbackMiddleware`)
        const routeIndex = router.stack.findIndex(l => l.route && l.route.path === `/shards`)
        expect(gateIndex).to.be.at.least(0)
        expect(gateIndex).to.be.below(routeIndex)
    })
})

describe(`api/v1 shards WebSocket stream`, () => {
    let previous
    let httpServer
    let stream
    let url

    /**
     * Open a client and settle with either the first message or the HTTP
     * status the upgrade was refused with.
     */
    function connect(headers = {}) {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(url, { headers })
            const messages = []
            socket.on(`message`, raw => {
                messages.push(JSON.parse(raw.toString()))
                if (messages.length === 1) resolve({ socket, messages })
            })
            socket.on(`unexpected-response`, (req, res) => resolve({ refused: res.statusCode }))
            socket.on(`error`, reject)
        })
    }

    function start(manager, options = {}) {
        return new Promise(resolve => {
            httpServer = http.createServer(express())
            stream = attachShardStream(httpServer, { manager, logger, intervalMs: 30, minIntervalMs: 10, ...options })
            httpServer.listen(0, `127.0.0.1`, () => {
                url = `ws://127.0.0.1:${httpServer.address().port}/api/v1/shards/stream`
                resolve()
            })
        })
    }

    beforeEach(() => {
        previous = process.env.PRIVATE_API_TOKEN
        process.env.PRIVATE_API_TOKEN = TOKEN
    })
    afterEach(done => {
        if (previous === undefined) delete process.env.PRIVATE_API_TOKEN
        else process.env.PRIVATE_API_TOKEN = previous
        stream.close()
        httpServer.close(() => done())
    })

    it(`refuses the upgrade without a valid bearer token`, async () => {
        await start(fakeManager([healthyShard(0)]))
        expect((await connect()).refused).to.equal(401)
        expect((await connect({ authorization: `Bearer wrong` })).refused).to.equal(401)
    })

    it(`refuses the upgrade when it was relayed by a proxy`, async () => {
        await start(fakeManager([healthyShard(0)]))
        const result = await connect({ authorization: `Bearer ${TOKEN}`, 'x-forwarded-for': `203.0.113.9` })
        expect(result.refused).to.equal(403)
    })

    it(`refuses upgrades on any other path`, async () => {
        await start(fakeManager([healthyShard(0)]))
        url = url.replace(`/shards/stream`, `/elsewhere`)
        expect((await connect({ authorization: `Bearer ${TOKEN}` })).refused).to.equal(404)
    })

    it(`pushes a snapshot on connect and keeps pushing on the interval`, async () => {
        await start(fakeManager([healthyShard(0, { guilds: 5 }), healthyShard(1, { guilds: 6 })]))
        const { socket, messages } = await connect({ authorization: `Bearer ${TOKEN}` })
        expect(messages[0].type).to.equal(`shards`)
        expect(messages[0].data.totalGuilds).to.equal(11)
        expect(messages[0].data.shards.map(s => s.codename)).to.deep.equal([shardNames[0], shardNames[1]])
        await new Promise(resolve => setTimeout(resolve, 120))
        expect(messages.length).to.be.at.least(3)
        socket.close()
    })

    it(`pushes early when a shard changes state`, async () => {
        const shard = healthyShard(0)
        await start(fakeManager([shard]), { intervalMs: 60000 })
        const { socket, messages } = await connect({ authorization: `Bearer ${TOKEN}` })
        shard.emit(`death`)
        await new Promise(resolve => setTimeout(resolve, 400))
        expect(messages.length).to.equal(2)
        socket.close()
    })
})
