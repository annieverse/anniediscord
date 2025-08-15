const { expect } = require(`chai`)
const { createStructuredLog, wrapLegacyLog } = require(`../../src/utils/structuredLogger`)

describe(`structuredLogger`, () => {
    describe(`createStructuredLog`, () => {
        it(`should create a basic structured log with required fields`, () => {
            const action = `test_action_successful`
            const result = createStructuredLog({ action })

            expect(result).to.have.property(`requestId`)
            expect(result).to.have.property(`action`, action)
            expect(result).to.have.property(`timestamp`)
            expect(result.requestId).to.be.a(`string`)
            expect(result.timestamp).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
        })

        it(`should include optional fields when provided`, () => {
            const options = {
                action: `user_command_executed`,
                userId: `123456789`,
                guildId: `987654321`,
                channelId: `555666777`,
                shardId: `SHARD_ID:0/CAKE`,
                context: { command: `profile`, args: [] }
            }

            const result = createStructuredLog(options)

            expect(result.userId).to.equal(options.userId)
            expect(result.guildId).to.equal(options.guildId)
            expect(result.channelId).to.equal(options.channelId)
            expect(result.shardId).to.equal(options.shardId)
            expect(result.context).to.deep.equal(options.context)
        })

        it(`should use custom requestId when provided`, () => {
            const customRequestId = `custom-test-id`
            const result = createStructuredLog({ 
                action: `test_action`, 
                requestId: customRequestId 
            })

            expect(result.requestId).to.equal(customRequestId)
        })

        it(`should not include optional fields when not provided`, () => {
            const result = createStructuredLog({ action: `test_action` })

            expect(result).to.not.have.property(`userId`)
            expect(result).to.not.have.property(`guildId`)
            expect(result).to.not.have.property(`channelId`)
            expect(result).to.not.have.property(`shardId`)
            expect(result).to.not.have.property(`context`)
        })
    })

    describe(`wrapLegacyLog`, () => {
        it(`should wrap legacy string message into structured format`, () => {
            const action = `legacy_action_converted`
            const legacyMessage = `This is a legacy log message`
            const result = wrapLegacyLog(action, legacyMessage)

            expect(result).to.have.property(`requestId`)
            expect(result).to.have.property(`action`, action)
            expect(result).to.have.property(`timestamp`)
            expect(result).to.have.property(`context`, legacyMessage)
        })

        it(`should wrap legacy object into structured format`, () => {
            const action = `database_error_occurred`
            const legacyData = { error: `Connection failed`, code: 500 }
            const result = wrapLegacyLog(action, legacyData)

            expect(result.context).to.deep.equal(legacyData)
        })

        it(`should include additional options in wrapped log`, () => {
            const action = `wrapped_action`
            const legacyMessage = `Legacy message`
            const additionalOptions = {
                userId: `123456`,
                guildId: `789012`
            }

            const result = wrapLegacyLog(action, legacyMessage, additionalOptions)

            expect(result.context).to.equal(legacyMessage)
            expect(result.userId).to.equal(additionalOptions.userId)
            expect(result.guildId).to.equal(additionalOptions.guildId)
        })
    })
})