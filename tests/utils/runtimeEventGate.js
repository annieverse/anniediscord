const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)
const runtimeEventGate = require(`../../src/utils/runtimeEventGate`)

function mockClient() {
	return {
		logger: {
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub()
		}
	}
}

describe(`Runtime Event Gate`, () => {
	it(`keeps events locked until both manager spawn and ready tasks are complete`, () => {
		const client = mockClient()
		runtimeEventGate.initialize(client)

		expect(client.eventProcessingLocked).to.equal(true)
		expect(runtimeEventGate.markManagerSpawnComplete(client, { source: `test` })).to.equal(false)
		expect(client.eventProcessingLocked).to.equal(true)
		expect(client.managerSpawnComplete).to.equal(true)
		expect(client.readyTasksComplete).to.equal(false)

		expect(runtimeEventGate.shouldProcess(client, `messageCreate`, 16000)).to.equal(false)

		expect(runtimeEventGate.markReadyTasksComplete(client, { shardIds: [0] })).to.equal(true)
		expect(client.eventProcessingLocked).to.equal(false)
		expect(runtimeEventGate.shouldProcess(client, `messageCreate`, 17000)).to.equal(true)
		expect(client.logger.info.calledWithMatch({
			action: `runtime_event_processing_unlocked`,
			trigger: `ready_tasks_complete`
		})).to.equal(true)
	})

	it(`also unlocks when ready tasks finish before manager spawn`, () => {
		const client = mockClient()
		runtimeEventGate.initialize(client)

		expect(runtimeEventGate.markReadyTasksComplete(client)).to.equal(false)
		expect(client.eventProcessingLocked).to.equal(true)
		expect(runtimeEventGate.markManagerSpawnComplete(client)).to.equal(true)
		expect(client.eventProcessingLocked).to.equal(false)
	})

	it(`throttles blocked event logs while startup is locked`, () => {
		const client = mockClient()
		runtimeEventGate.initialize(client)

		expect(runtimeEventGate.shouldProcess(client, `interactionCreate`, 16000)).to.equal(false)
		expect(runtimeEventGate.shouldProcess(client, `interactionCreate`, 17000)).to.equal(false)
		expect(runtimeEventGate.shouldProcess(client, `interactionCreate`, 32001)).to.equal(false)

		expect(client.logger.warn.callCount).to.equal(2)
		expect(client.logger.warn.firstCall.args[0]).to.include({
			action: `runtime_event_processing_blocked`,
			eventName: `interactionCreate`
		})
	})
})
