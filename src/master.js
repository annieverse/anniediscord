const getCustomShardId = require(`./utils/shardIdParser`)
const express = require(`express`)
const createLogger = require(`../pino.config.js`)
const fs = require(`fs`)
module.exports = function masterShard() {
	const logger = createLogger.child({ shard: `MASTER_SHARD` })
	process.on(`unhandledRejection`, (reason) => {
		logger.error({ 
			action: `UNHANDLED_REJECTION`,
			msg: reason
		})
	})
	process.on(`uncaughtException`, err => {
		logger.error({ 
			action: `UNCAUGHT_EXCEPTION`,
			msg: err
		})
	})
	function makeDirs() {
		if (!fs.existsSync(`./src/assets/customShop`)) fs.mkdirSync(`./src/assets/customShop`,)
		if (fs.existsSync(`./src/assets/customShop`)) logger.info(`Directory './src/assets/customShop' exists`)
		if (!fs.existsSync(`./src/assets/customWelcomer`)) fs.mkdirSync(`./src/assets/customWelcomer`)
		if (fs.existsSync(`./src/assets/customWelcomer`)) logger.info(`Directory './src/assets/customWelcomer' exists`)
		if (!fs.existsSync(`./src/assets/selfupload`)) fs.mkdirSync(`./src/assets/selfupload`)
		if (fs.existsSync(`./src/assets/selfupload`)) logger.info(`Directory './src/assets/selfupload' exists`)
		if (!fs.existsSync(`./.logs`)) fs.mkdirSync(`./.logs`)
		if (fs.existsSync(`./.logs`)) logger.info(`Directory './.logs'`)
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
		const shardLogger = createLogger.child({ shard: shard.id })
		shard.on(ShardEvents.Death, (p) => {
			shardLogger.error({ action: `shard_died`, msg: p })
		})
		shard.on(ShardEvents.Disconnect, () => {
			shardLogger.warn({ action: `shard_disconnected` })
			// Log WebSocket disconnection for debugging
			if (shard.worker && shard.worker.killed) {
				shardLogger.warn({ action: `shard_worker_killed` })
			}
		})
		shard.on(`error`, (error) => {
			shardLogger.error({ action: `shard_error`, msg: error })
			// Specifically handle WebSocket handshake timeouts
			if (error.message && error.message.includes(`handshake has timed out`)) {
				shardLogger.warn({ action: `shard_handshake_timeout` })
			}
		})
		shard.on(ShardEvents.Message, (message) => shardLogger.debug({ action: `shard_message`, msg: message }))
		shard.on(ShardEvents.Ready, () => shardLogger.info({ action: `shard_ready` }))
		shard.on(ShardEvents.Reconnecting, () => {
			shardLogger.warn({ action: `shard_reconnecting` })
			// Log reconnection attempts for WebSocket issues
			shardLogger.info({ action: `shard_reconnecting_attempt`, msg: `Attempting to reconnect to Discord gateway` })
		})
		shard.on(ShardEvents.Resume, () => shardLogger.info({ action: `shard_resumed` }))
		shard.on(ShardEvents.Spawn, () => shardLogger.info({ action: `shard_spawned` }))
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
			}, { msg: { serverCount: serverCount, shardCount: shardCount } })
		} catch (error) {
			logger.error({ action: `sequential_shards_spawn_error`, msg: error })
		}
	})

	// Top.gg webhook listener for vote reward system
	const { Webhook } = require(`@top-gg/sdk`)
	const wh = new Webhook(process.env.DBLWEBHOOK_AUTH)
	server.post(`/dblwebhook`, wh.listener(async vote => {
		const { v7: uuidv7 } = require(`uuid`)
		const userId = vote.user
		const voteLogger = logger.child({ requestId: uuidv7(), userId })
		voteLogger.info({ action: `topgg_vote_endpoint_new` })
		// 1. Attempt to fire webhook for dev notification
		const { WebhookClient } = require(`discord.js`)
		const voteWebhook = process.env.VOTE_WEBHOOK_URL ? new WebhookClient({ url: process.env.VOTE_WEBHOOK_URL }) : null
		if (voteWebhook) {
			try {
				await voteWebhook.send({
					content: `Received vote from ${userId} with RAW:${JSON.stringify(vote)}`
				})
			} catch (error) {
				voteLogger.error({ action: `topgg_vote_endpoint_webhook_notification_failed`, msg: error })
			}
		}
		else {
			voteLogger.warn({ action: `topgg_vote_endpoint_webhook_unavailable`, targetUrl: process.env.VOTE_WEBHOOK_URL })
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
				const voteRewardLogger = voteLogger.child({ shard: getCustomShardId(currentShardId) })
				voteRewardLogger.info({ action: `topgg_vote_endpoint_processing_reward` })
				// 3. Distribute reward
				client.db.databaseUtils.updateInventory({
					itemId: 52,
					userId: userId,
					value: 5000,
					distributeMultiAccounts: true
				})
					.then(() => voteRewardLogger.info({ action: `topgg_vote_endpoint_distribute_reward_success` }))
					.catch((error) => voteRewardLogger.warn({ action: `topgg_vote_endpoint_distribute_reward_failed`, msg: error }))

				// 4. Attempt to notify the voter (user)
				const artcoinsEmoji = await client.getEmoji(`artcoins`, `577121315480272908`)
				const user = await client.users.fetch(userId) // Fetches user from Discord API. Regardless of the shard, this still works.
				try {
					await user.send(`**⋆. thankyouu for the voting, ${user.username}!** i've sent <${artcoinsEmoji}>**5,000** to your inventory as the reward!\nif you wish to support the development further, feel free to drop by in my support server!\nhttps://discord.gg/HjPHCyG346`)
					voteRewardLogger.info({ action: `topgg_vote_endpoint_reward_notification_success` })
				} catch (e) {
					voteRewardLogger.warn({ action: `topgg_vote_endpoint_reward_notification_failed`, msg: e })
				}
				return { success: true, userId: userId } // Indicate successful processing
			}, { msg: { userId } })
			if (!results.some(r => r && r.success)) return voteLogger.warn({ action: `topgg_vote_endpoint_end`, msg:`no success indicator` })
		}
		catch (error) {
			voteLogger.error({ action: `topgg_vote_endpoint_error`, msg: error })
		}
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info({ action: `LISTENING_TO_PORT`, port }))
}