const shardName = require(`./config/shardName.json`)
const express = require(`express`)
const logger = require(`pino`)({ name: `MASTER_SHARD` })
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
		logger.info(`Unhandled rejection: ${err.message}`, err)
		logger.warn(err)
	})
	function makeDirs() {
		if (!fs.existsSync(`./src/assets/customShop`)) fs.mkdirSync(`./src/assets/customShop`,)
		if (fs.existsSync(`./src/assets/customShop`)) logger.info(`Directory './src/assets/customShop' exists`)
		if (!fs.existsSync(`./src/assets/customWelcomer`)) fs.mkdirSync(`./src/assets/customWelcomer`)
		if (fs.existsSync(`./src/assets/customWelcomer`)) logger.info(`Directory './src/assets/customWelcomer' exists`)
		if (!fs.existsSync(`./src/assets/selfupload`)) fs.mkdirSync(`./src/assets/selfupload`)
		if (fs.existsSync(`./src/assets/selfupload`)) logger.info(`Directory './src/assets/selfupload' exists`)
	}
	if (fs.existsSync(`./assets`)) {
		makeDirs()
	} else {
		fs.mkdirSync(`./assets`)
		logger.info(`Directory './assets' exists`)
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
	manager.spawn(`auto`, 30000, 60000 * 2).then(async (collection)=>{
		try {
			const manager = collection.get(0).manager
			const fetchServers = await manager.fetchClientValues(`guilds.cache.size`)
			const serverCount = fetchServers.reduce((prev, val) => prev + val, 0)
			const shardCount = manager.totalShards
			manager.broadcastEval((c,{serverCount,shardCount})=>{
				if (!c.isReady()) return
				if (c.dev) return
				c.dblApi.postStats({
					serverCount: serverCount,
					shardId: c.shard.ids[0],
					shardCount: shardCount
				})
			}, {context:{serverCount:serverCount,shardCount:shardCount},shard: 0 })
		} catch (error) {
			logger.error(`[master.js] > ${error}`)
		}
	})

	const wh = new Webhook(process.env.DBLWEBHOOK_AUTH)
	//  Send shard count to DBL webhook.
	server.post(`/dblwebhook`, wh.listener((vote) => {
		const userId = vote.user
		logger.info(`USER_ID:${userId} just voted!`)
		function sendReward(c, { userId }) {
			c.users.fetch(userId).then(async user => {
				//  Only perform on SHARD_ID:0
				if (c.shard.ids[0] === 0) {
					c.db.databaseUtils.updateInventory({
						itemId: 52,
						userId: userId,
						value: 5000,
						distributeMultiAccounts: true
					})
					const artcoinsEmoji = await c.getEmoji(`artcoins`)
					user.send(`**Thanks for the voting, ${user.username}!** I've sent ${artcoinsEmoji}**5,000** to your inventory as the reward!`)
						.catch(e => c.logger.warn(`FAIL to DM USER_ID:${userId} on SHARD_ID:${c.shard.ids[0]} > ${e.message}`))
					c.logger.info(`Vote reward successfully sent to USER_ID:${userId}`)
				}
			})
				.catch(e => {
					c.logger.warn(`FAIL to find USER_ID:${userId} on SHARD_ID:${c.shard.ids[0]} so no reward given > ${e.message}`)
				})
		}
		manager.broadcastEval(sendReward, { context: { userId: userId } })
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info(`<LISTEN> PORT:${port}`))
}