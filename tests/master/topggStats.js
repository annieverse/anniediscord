const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)
const sinon = require(`sinon`)
const { postTopggStats } = require(`../../src/master`)

function mockLogger() {
	return {
		debug: sinon.stub(),
		info: sinon.stub(),
		warn: sinon.stub()
	}
}

describe(`Master Top.gg stats`, () => {
	it(`posts aggregated stats through the Top.gg API`, async () => {
		const logger = mockLogger()
		const topggApi = {
			postStats: sinon.stub().resolves({ serverCount: 12, shardCount: 2 })
		}

		const result = await postTopggStats({
			logger,
			serverCount: 12,
			shardCount: 2,
			token: `test-token`,
			nodeEnv: `production`,
			topggApi
		})

		expect(result).to.deep.equal({ serverCount: 12, shardCount: 2 })
		expect(topggApi.postStats.calledOnceWithExactly({ serverCount: 12, shardCount: 2 })).to.equal(true)
		expect(logger.info.calledWithMatch({
			action: `topgg_stats_post_success`,
			serverCount: 12,
			shardCount: 2
		})).to.equal(true)
	})

	it(`skips stats posting in development`, async () => {
		const logger = mockLogger()
		const topggApi = {
			postStats: sinon.stub().resolves()
		}

		const result = await postTopggStats({
			logger,
			serverCount: 12,
			shardCount: 2,
			token: `test-token`,
			nodeEnv: `development`,
			topggApi
		})

		expect(result).to.equal(null)
		expect(topggApi.postStats.notCalled).to.equal(true)
		expect(logger.debug.calledWithMatch({
			action: `topgg_stats_post_skipped`,
			reason: `development`
		})).to.equal(true)
	})

	it(`skips stats posting when DBLTOKEN is missing`, async () => {
		const logger = mockLogger()

		const result = await postTopggStats({
			logger,
			serverCount: 12,
			shardCount: 2,
			token: ``,
			nodeEnv: `production`
		})

		expect(result).to.equal(null)
		expect(logger.warn.calledWithMatch({
			action: `topgg_stats_post_skipped`,
			reason: `missing_dbltoken`
		})).to.equal(true)
	})
})
