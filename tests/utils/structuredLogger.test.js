const { expect } = require(`chai`)
const { createStructuredLog, validateStructuredLog } = require(`../../src/utils/structuredLogger`)

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

    describe(`validateStructuredLog`, () => {
        it(`should validate a properly structured log object`, () => {
            const validLog = {
                requestId: `test-request-id`,
                action: `test_action`,
                timestamp: new Date().toISOString(),
                userId: `123456789`
            }

            expect(() => validateStructuredLog(validLog)).to.not.throw()
        })

        it(`should throw error for missing action property`, () => {
            const invalidLog = {
                requestId: `test-request-id`,
                timestamp: new Date().toISOString()
            }

            expect(() => validateStructuredLog(invalidLog)).to.throw(`Log object must have a valid "action" property (string)`)
        })

        it(`should throw error for missing requestId property`, () => {
            const invalidLog = {
                action: `test_action`,
                timestamp: new Date().toISOString()
            }

            expect(() => validateStructuredLog(invalidLog)).to.throw(`Log object must have a valid "requestId" property (string)`)
        })

        it(`should throw error for missing timestamp property`, () => {
            const invalidLog = {
                requestId: `test-request-id`,
                action: `test_action`
            }

            expect(() => validateStructuredLog(invalidLog)).to.throw(`Log object must have a valid "timestamp" property (string)`)
        })

        it(`should throw error for non-object input`, () => {
            expect(() => validateStructuredLog(`not an object`)).to.throw(`Log object must be a valid object`)
            expect(() => validateStructuredLog(null)).to.throw(`Log object must be a valid object`)
            expect(() => validateStructuredLog(123)).to.throw(`Log object must be a valid object`)
        })

        it(`should throw error for invalid property types`, () => {
            const invalidLog1 = {
                requestId: 123,
                action: `test_action`,
                timestamp: new Date().toISOString()
            }
            expect(() => validateStructuredLog(invalidLog1)).to.throw(`Log object must have a valid "requestId" property (string)`)

            const invalidLog2 = {
                requestId: `test-request-id`,
                action: 123,
                timestamp: new Date().toISOString()
            }
            expect(() => validateStructuredLog(invalidLog2)).to.throw(`Log object must have a valid "action" property (string)`)

            const invalidLog3 = {
                requestId: `test-request-id`,
                action: `test_action`,
                timestamp: 123
            }
            expect(() => validateStructuredLog(invalidLog3)).to.throw(`Log object must have a valid "timestamp" property (string)`)
        })
    })
})