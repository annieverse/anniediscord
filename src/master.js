const shardName = require(`./config/shardName.json`)
const express = require(`express`)
const { masterLogger: logger } = require(`../pino.config.js`)
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
	// Intentionally log a error when bot starts up.
	logger.error(`\n[MASTER_SHARD] > The bot was started/restarted on ${new Date()}.\nThis is expected, and not an error.\n`)

	process.on(`unhandledRejection`, (reason, promise) => {
		logger.warn(`\nUnhandled Rejection at:`, promise, `reason:`, reason)
		logger.error(promise, reason)
	})
	process.on(`uncaughtException`, err => {
		logger.warn(`\nUnhandled Exception: `, err)
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
	const { ShardingManager, ShardEvents } = require(`discord.js`)
	const manager = new ShardingManager(`./src/annie.js`, {
		respawn: process.env.NODE_ENV !== `production` || process.env.NODE_ENV !== `production_beta` ? false : true,
		token: process.env.BOT_TOKEN,
		execArgv: [`--trace-warnings`],
	})

	const server = express()
	manager.on(`shardCreate`, shard => {
		const id = getCustomShardId(shard.id)
		shard.on(ShardEvents.Death, (p) => {
			logger.error(`${id} <DIED>`)
			logger.error(p)
		})
		shard.on(ShardEvents.Disconnect, () => {
			logger.warn(`${id} <DISCONNECTED>`)
			// Log WebSocket disconnection for debugging
			if (shard.worker && shard.worker.killed) {
				logger.warn(`${id} Worker process was killed, likely due to connection issues`)
			}
		})
		shard.on(`error`, (error) => {
			logger.error(`${id} <ERROR>: ${error.message}`)
			// Specifically handle WebSocket handshake timeouts
			if (error.message && error.message.includes(`handshake has timed out`)) {
				logger.warn(`${id} WebSocket handshake timeout detected. This may resolve with retry logic.`)
			}
		})
		shard.on(ShardEvents.Message, (message) => logger.info(`<Shard Message> ${message}`))
		shard.on(ShardEvents.Ready, () => logger.info(`${id} <READY>`))
		shard.on(ShardEvents.Reconnecting, () => {
			logger.warn(`${id} <RECONNECTING>`)
			// Log reconnection attempts for WebSocket issues
			logger.info(`${id} Attempting to reconnect to Discord gateway`)
		})
		shard.on(ShardEvents.Resume, () => logger.info(`${id} <RESUMED>`))
		shard.on(ShardEvents.Spawn, () => logger.info(`${id} <SPAWNED>`))

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

	// Top.gg webhook listener for vote reward system
	const { Webhook } = require(`@top-gg/sdk`)
	const wh = new Webhook(process.env.DBLWEBHOOK_AUTH)
	server.post(`/dblwebhook`, wh.listener(async vote => {
		logger.info(`[VOTE_ENDPOINT_BEGIN]: new vote ${JSON.stringify(vote)}`)
		const userId = vote.user
		// 1. Attempt to fire webhook for dev notification
		const { WebhookClient } = require(`discord.js`)
		const voteWebhook = process.env.VOTE_WEBHOOK_URL ? new WebhookClient({ url: process.env.VOTE_WEBHOOK_URL }) : null
		if (voteWebhook) {
			try {
				await voteWebhook.send({
					content: `Received vote from ${userId} with RAW:${JSON.stringify(vote)}`
				})
			} catch (error) {
				logger.error(`[VOTE_ENDPOINT_WEBHOOK_NOTIFICATION]: failed to send vote notification webhook > ${error.message}`)
			}
		}
		else {
			logger.warn(`[VOTE_ENDPOINT_WEBHOOK_NOTIFICATION]: webhook client unavailable > TargetURL:${process.env.VOTE_WEBHOOK_URL}`)
		}

		// 2. Distribute reward and notify user on a single, available shard.
		// We don't need to find a specific "reachable" shard for the user.
		// Any shard can perform the database update and send a DM.
		// For simplicity and efficiency, let's pick the first available shard (shard 0 usually, but any shard can do).
		// Or, you can broadcast to all if your db operations are idempotent.
		// For database updates, it's safer to ensure it runs only once per vote.
		// Sending a DM also only needs to happen once.
		try {
			// Use broadcastEval and pick one shard, or let the first one to process handle it.
			// A simpler and more robust way is to just do `manager.broadcastEval` and let
			// the first shard that successfully processes the user handle the DM/reward.
			// However, this assumes your `updateInventory` function is safe to call multiple times,
			// or you implement a lock.
			// A better pattern for a single-action task like this is to *not* broadcast if you can
			// do it from the manager, or ensure it's idempotent.

			// Given your current structure, let's execute the logic on the *first* available shard (shard 0).
			// If you specifically want to run on a shard where the user might be cached (less API calls),
			// you'd typically implement a client.guilds.cache.has(user.id) check within the broadcastEval
			// and return true/false to signal if that shard should handle it.
			// But for `client.users.fetch` and DB ops, any shard is fine.

			// A more direct way to ensure it runs *once* and handles retries from the manager:
			// You can run this logic directly from the manager if your DB connection is available here,
			// or you *must* broadcast. Let's stick with broadcastEval as per your previous structure.
			// Instead of lookupReachableShard, we will run this on a specific shard.
			// For simplicity, let's just pick shard 0 to execute the logic:
			const results = await manager.broadcastEval(async (client, { userId }) => {
				// Check if this is the designated shard to perform the actions
				// This ensures the database update and DM sending happen only once
				const currentShardId = client.shard.ids[0]
				if (currentShardId !== 0) return null // Skip if not the target shard
				client.logger.info(`[VOTE_ENDPOINT_BROADCAST_EVAL]: performing on SHARD_ID:${currentShardId} for USER_ID:${userId}`)

				// 3. Distribute reward
				client.db.databaseUtils.updateInventory({
					itemId: 52,
					userId: userId,
					value: 5000,
					distributeMultiAccounts: true
				})
					.then(() => client.logger.info(`[VOTE_ENDPOINT_DISTRIBUTE_REWARD]: successfully sent to USER_ID:${userId}`))
					.catch((error) => client.logger.warn(`[VOTE_ENDPOINT_DISTRIBUTE_REWARD]: failed to distribute reward to USER_ID:${userId} > ${error.message}`))

				// 4. Attempt to notify the voter (user)
				const artcoinsEmoji = await client.getEmoji(`artcoins`, `577121315480272908`)
				const user = await client.users.fetch(userId) // Fetches user from Discord API. Regardless of the shard, this still works.
				try {
					await user.send(`**⋆. thankyouu for the voting, ${user.username}!** i've sent ${artcoinsEmoji}**5,000** to your inventory as the reward!\nif you wish to support the development further, feel free to drop by in my support server!\nhttps://discord.gg/HjPHCyG346`)
					client.logger.info(`[VOTE_ENDPOINT_REWARD_NOTIFICATION] successfully sent to USER_ID:${userId}`)
				} catch (e) {
					client.logger.warn(`[VOTE_ENDPOINT_REWARD_NOTIFICATION] failed to notify USER_ID:${userId} > ${e.message}`)
				}
				return { success: true, userId: userId } // Indicate successful processing
			}, { context: { userId } })
			if (!results.some(r => r && r.success)) return logger.warn(`[VOTE_ENDPOINT_END] failed to finalize the vote reward distribution due to no success indicator.`)
		}
		catch (error) {
			logger.error(`[VOTE_ENDPOINT_ERROR]: encountered error during vote reward processing for USER_ID:${userId} > ${error.message}`)
		}
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info(`<LISTEN> PORT:${port}`))
}