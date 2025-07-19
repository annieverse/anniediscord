const shardName = require(`./config/shardName.json`)
const express = require(`express`)
const { masterLogger: logger } = require(`../pino.config.js`)
const { Webhook } = require(`@top-gg/sdk`)
const fs = require(`fs`)

/**
 *  Parse shard name for given shard id.
 *  @param {number} id
 *  @return {string}
 */
const getCustomShardId = (id) => {
	return `[SHARD_ID:${id}/${shardName[id]}]`
}

module.exports = function masterShard() {
	process.on(`unhandledRejection`, err => {
		logger.warn(`Unhandled rejection: ${err.message}`, err)
		logger.error(err)
	})
	function makeDirs() {
		if (!fs.existsSync(`./src/assets/customShop`)) fs.mkdirSync(`./src/assets/customShop`,)
		if (fs.existsSync(`./src/assets/customShop`)) logger.info(`Directory './src/assets/customShop' exists`)
		if (!fs.existsSync(`./src/assets/customWelcomer`)) fs.mkdirSync(`./src/assets/customWelcomer`)
		if (fs.existsSync(`./src/assets/customWelcomer`)) logger.info(`Directory './src/assets/customWelcomer' exists`)
		if (!fs.existsSync(`./src/assets/selfupload`)) fs.mkdirSync(`./src/assets/selfupload`)
		if (fs.existsSync(`./src/assets/selfupload`)) logger.info(`Directory './src/assets/selfupload' exists`)
		if (!fs.existsSync(`./.logs`)) fs.mkdirSync(`./.logs`)
		if (fs.existsSync(`./.logs`)) logger.info(`Directory './.logs`)
	}
	if (fs.existsSync(`./src/assets`)) {
		makeDirs()
	} else {
		fs.mkdirSync(`./src/assets`)
		logger.info(`Directory './src/assets' exists`)
		makeDirs()
	}
	const { ShardingManager } = require(`discord.js`)
	const manager = new ShardingManager(`./src/annie.js`, {
		respawn: process.env.NODE_ENV !== `production` || process.env.NODE_ENV !== `production_beta` ? false : true,
		token: process.env.BOT_TOKEN,
		execArgv: [`--trace-warnings`],
	})

	const server = express()
	manager.on(`shardCreate`, shard => {
		const id = getCustomShardId(shard.id)
		shard.on(`spawn`, () => logger.info(`${id} <SPAWNED>`))
		shard.on(`death`, () => logger.error(`${id} <DIED>`))
		shard.on(`disconnect`, () => logger.warn(`${id} <DISCONNECTED>`))
		shard.on(`ready`, () => logger.info(`${id} <READY>`))
		shard.on(`reconnecting`, () => logger.warn(`${id} <RECONNECTING>`))
	})
	//  Spawn shard sequentially with 30 seconds interval. 
	//  Will send timeout warn in 2 minutes.
	manager.spawn(`auto`, 30000, 60000 * 2).then(async (collection) => {
		try {
			const m = collection.get(0).manager
			const fetchServers = await m.fetchClientValues(`guilds.cache.size`)
			const serverCount = fetchServers.reduce((prev, val) => prev + val, 0)
			const shardCount = m.totalShards
			m.broadcastEval((c, { serverCount, shardCount }) => {
				if (!c.isReady()) return
				if (c.dev) return
				c.dblApi.postStats({
					serverCount: serverCount,
					shardCount: shardCount
				})
			}, { context: { serverCount: serverCount, shardCount: shardCount } })
		} catch (error) {
			logger.error(`[master.js] > ${error}`)
		}
	})

	const wh = new Webhook(process.env.DBLWEBHOOK_AUTH)
	server.post(`/dblwebhook`, wh.listener(async (vote) => {
		logger.info(`USER_ID:${userId} just voted!`)
		const userId = vote.user

		const { WebhookClient } = require(`discord.js`)
		const voteWebhook = process.env.VOTE_WEBHOOK_URL ? new WebhookClient({ url: process.env.VOTE_WEBHOOK_URL }) : null
		if (voteWebhook) {
			voteWebhook.send({
				content: `Received vote from <@${userId}> (${userId})`,
				allowedMentions: { users: [userId] }
			})
		}

		async function fetchUser(c, { userId }) {
			let user = null
			if (c.users.cache.has(userId)) user = c.users.cache.get(userId)
			user = c.users.fetch(userId)

			// Update currency across all records reguardless
			c.db.databaseUtils.updateInventory({
				itemId: 52,
				userId: userId,
				value: 5000,
				distributeMultiAccounts: true
			})

			if (!user) return false

			// Attempt to send message to user
			const artcoinsEmoji = await c.getEmoji(`artcoins`, `577121315480272908`)
			user.send(`**Thanks for the voting, ${user.username}!** I've sent ${artcoinsEmoji}**5,000** to your inventory as the reward!`)
				.catch(e => c.logger.warn(`FAIL to DM USER_ID:${userId} > ${e.message}`))
			c.logger.info(`Vote reward successfully sent to USER_ID:${userId}`)
			return true
		}

		const result = (await manager.broadcastEval(fetchUser, { context: { userId: userId } }))[0]
		if (!result) return
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info(`<LISTEN> PORT:${port}`))
}