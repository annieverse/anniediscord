const { expect } = require(`chai`)
const fs = require(`fs`)
const path = require(`path`)
const { createStandardLog, createShardLogger } = require(`../../src/utils/standardLogger`)

describe(`Enhanced Logging System`, () => {
    describe(`Standard Log Creation`, () => {
        it(`should create a basic log entry with action and auto-generated requestId`, () => {
            const log = createStandardLog(`test_action`)
            
            expect(log).to.have.property(`requestId`)
            expect(log).to.have.property(`action`, `test_action`)
            expect(log.requestId).to.be.a(`string`)
            expect(log.requestId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })

        it(`should create a log entry with all optional fields`, () => {
            const options = {
                requestId: `custom-request-id`,
                userId: `123456789`,
                guildId: `987654321`,
                channelId: `555666777`,
                shardId: `SHARD_ID:0/CAKE`,
                context: { message: `test context` }
            }
            
            const log = createStandardLog(`test_action_full`, options)
            
            expect(log).to.deep.equal({
                requestId: `custom-request-id`,
                action: `test_action_full`,
                userId: `123456789`,
                guildId: `987654321`,
                channelId: `555666777`,
                shardId: `SHARD_ID:0/CAKE`,
                context: { message: `test context` }
            })
        })

        it(`should not include undefined optional fields`, () => {
            const log = createStandardLog(`test_action`, { userId: `123`, guildId: undefined })
            
            expect(log).to.have.property(`userId`, `123`)
            expect(log).to.not.have.property(`guildId`)
        })
    })

    describe(`Shard Logger Wrapper`, () => {
        let mockLogger
        let shardLogger

        beforeEach(() => {
            mockLogger = {
                info: function(data) { this.lastCall = { level: `info`, data } },
                warn: function(data) { this.lastCall = { level: `warn`, data } },
                error: function(data) { this.lastCall = { level: `error`, data } },
                debug: function(data) { this.lastCall = { level: `debug`, data } }
            }
            shardLogger = createShardLogger(mockLogger, `SHARD_ID:0/TEST`)
        })

        it(`should automatically include shard information in logs`, () => {
            shardLogger.info(`test_action`)
            
            expect(mockLogger.lastCall).to.exist
            expect(mockLogger.lastCall.level).to.equal(`info`)
            expect(mockLogger.lastCall.data).to.have.property(`action`, `test_action`)
            expect(mockLogger.lastCall.data).to.have.property(`shardId`, `SHARD_ID:0/TEST`)
            expect(mockLogger.lastCall.data).to.have.property(`requestId`)
        })

        it(`should support additional options in shard logger`, () => {
            shardLogger.error(`test_error`, { userId: `123`, context: `error occurred` })
            
            expect(mockLogger.lastCall.data).to.have.property(`action`, `test_error`)
            expect(mockLogger.lastCall.data).to.have.property(`shardId`, `SHARD_ID:0/TEST`)
            expect(mockLogger.lastCall.data).to.have.property(`userId`, `123`)
            expect(mockLogger.lastCall.data).to.have.property(`context`, `error occurred`)
        })

        it(`should provide access to original logger`, () => {
            expect(shardLogger._original).to.equal(mockLogger)
        })
    })
})