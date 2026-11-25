"use strict"
const { describe, it, beforeEach, afterEach } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)

//  Stub errorHandler at require-time (same pattern as tests/events/interactionCreate.js)
//  so we can observe what gets relayed to the support server.
const relayed = []
const Module = require(`module`)
const originalRequire = Module.prototype.require
Module.prototype.require = function (...args) {
    if (args[0].endsWith(`utils/errorHandler.js`) || args[0].endsWith(`utils/errorHandler`)) {
        return (client, payload) => {
            relayed.push(payload)
            return Promise.resolve()
        }
    }
    return originalRequire.apply(this, args)
}
const shardError = require(`../../src/events/shard/shardError`)
Module.prototype.require = originalRequire

const buildClient = () => ({ logger: { warn: sinon.stub(), error: sinon.stub() } })
const handshakeError = () => new Error(`Unexpected server response: 503`)

describe(`events/shard/shardError`, () => {
    let clock
    beforeEach(() => {
        relayed.length = 0
        shardError.resetTransientErrorLog()
        clock = sinon.useFakeTimers({ now: 1_000_000 })
    })
    afterEach(() => clock.restore())

    it(`recognises only 5xx gateway handshake failures as transient`, () => {
        expect(shardError.isTransientShardError(`Unexpected server response: 503`)).to.equal(true)
        expect(shardError.isTransientShardError(`Unexpected server response: 502`)).to.equal(true)
        expect(shardError.isTransientShardError(`Unexpected server response: 401`)).to.equal(false)
        expect(shardError.isTransientShardError(`read ECONNRESET`)).to.equal(false)
    })

    it(`logs a transient handshake failure as a warning without relaying it`, () => {
        const client = buildClient()
        shardError(client, handshakeError(), 0)
        expect(relayed).to.have.lengthOf(0)
        expect(client.logger.error.called).to.equal(false)
        expect(client.logger.warn.calledOnce).to.equal(true)
        expect(client.logger.warn.firstCall.args[0]).to.include({ action: `shard_error_transient`, shardId: 0, occurrences: 1 })
    })

    it(`relays any other shard error right away`, () => {
        const client = buildClient()
        const error = new Error(`read ECONNRESET`)
        shardError(client, error, 2)
        expect(relayed).to.have.lengthOf(1)
        expect(relayed[0]).to.include({ fileName: `shardError.js`, errorType: `normal`, error_message: `read ECONNRESET` })
        expect(client.logger.error.firstCall.args[0]).to.include({ action: `shard_error`, shardId: 2, err: error })
    })

    it(`relays once when transient failures keep repeating on the same shard`, () => {
        const client = buildClient()
        for (let i = 0; i < shardError.TRANSIENT_ERROR_THRESHOLD; i++) shardError(client, handshakeError(), 0)
        expect(relayed).to.have.lengthOf(1)
        expect(client.logger.error.firstCall.args[0]).to.include({ action: `shard_error_persistent`, shardId: 0 })
        //  The counter restarts after relaying
        shardError(client, handshakeError(), 0)
        expect(relayed).to.have.lengthOf(1)
    })

    it(`counts each shard separately`, () => {
        const client = buildClient()
        for (let i = 0; i < shardError.TRANSIENT_ERROR_THRESHOLD - 1; i++) shardError(client, handshakeError(), 0)
        shardError(client, handshakeError(), 1)
        expect(relayed).to.have.lengthOf(0)
    })

    it(`forgets transient failures older than the window`, () => {
        const client = buildClient()
        for (let i = 0; i < shardError.TRANSIENT_ERROR_THRESHOLD - 1; i++) shardError(client, handshakeError(), 0)
        clock.tick(shardError.TRANSIENT_ERROR_WINDOW_MS + 1)
        shardError(client, handshakeError(), 0)
        expect(relayed).to.have.lengthOf(0)
    })

    it(`falls back to placeholders when the error carries no message or stack`, () => {
        const client = buildClient()
        shardError(client, {}, 0)
        expect(relayed[0]).to.include({ error_message: `An unknown error occurred`, error_stack: `No stack trace available` })
    })
})
