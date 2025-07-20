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
	server.post(`/dblwebhook`, wh.listener(vote => {
		const userId = vote.user
		logger.info(`USER_ID:${userId} just voted!`)


		//  1. Attempt to fire webhook for dev notification
		const { WebhookClient } = require(`discord.js`)
		const voteWebhook = process.env.VOTE_WEBHOOK_URL ? new WebhookClient({ url: process.env.VOTE_WEBHOOK_URL }) : null
		if (voteWebhook) {
			voteWebhook.send({
				content: `Received vote from <@${userId}> (${userId})`,
				allowedMentions: { users: [userId] }
			})
		}


		//  2. Find in the shard where the voter (user) is reachable
		lookupReachableShard().then(shard => { 
			//  Skip reward for voter who aren't reachable in any shard
			if (shard === undefined) return logger.warn(`USER_ID:${userId} is not reachable in any shard. Skipping reward distribution.`)
			manager.shard.broadcastEval(async (client, { userId }) => {
				// 	3. Distribute reward as early as possible
				//  Ensuring the voter guaranteed to receive the reward first
				client.db.databaseUtils.updateInventory({
					itemId: 52,
					userId: userId,
					value: 5000,
					distributeMultiAccounts: true
				})
				// 4. Attempt to notify the voter (user)
				// Regarding the vote reward.
				// If the DM is locked, omit process.
				const artcoinsEmoji = await client.getEmoji(`artcoins`, `577121315480272908`)
				const user = await client.users.fetch(userId)
				user
					.send(`**Thanks for the voting, ${user.username}!** I've sent ${artcoinsEmoji}**5,000** to your inventory as the reward!`)
					.then(() => client.logger.info(`[VOTE_REWARD_NOTIFICATION] successfully sent to USER_ID:${userId}`))
					.catch(e => client.logger.warn(`[VOTE_REWARD_NOTIFICATION] failed to notify USER_ID:${userId} > ${e.message}`))
				client.logger.info(`[VOTE_REWARD] Successfully sent to USER_ID:${userId}`)
			}, { context: { userId }, shard: shard })
		})


		// Lookup for the shard where the voter (user) is reachable
		async function lookupReachableShard() {
			//  Pool of shard IDs where the voter (user) is reachable. Null values if unreachable in the shard.
			const shards = await manager.broadcastEval(async (client, { userId }) => {
				const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null)
				if (user) return client.shard.ids[0]
				return null
			}, { context: { userId } })
			// Get the first non-null shard ID from the pool
			return shards.find(id => id !== null)
		}
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info(`<LISTEN> PORT:${port}`))
}