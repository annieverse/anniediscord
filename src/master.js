const getCustomShardId = require(`./utils/shardIdParser`)
const express = require(`express`)
const createLogger = require(`../pino.config.js`)
const fs = require(`fs`)
const pruneSelfUploadCovers = require(`./utils/pruneSelfUploadCovers.js`)
module.exports = async function masterShard() {
	const logger = createLogger.child({ shard: `MASTER_SHARD` })
	let initialSpawnComplete = false

	async function unlockShardRuntimeEvents(manager, action = `manager_spawn_complete`) {
		const results = await manager.broadcastEval((client, { action }) => {
			const metadata = { source: action, shardIds: client.shard.ids }
			if (typeof client.unlockEventProcessing === `function`) {
				const unlocked = client.unlockEventProcessing(metadata)
				return {
					shardIds: client.shard.ids,
					unlocked,
					eventProcessingLocked: client.eventProcessingLocked,
					managerSpawnComplete: client.managerSpawnComplete,
					readyTasksComplete: client.readyTasksComplete
				}
			}
			client.managerSpawnComplete = true
			client.eventProcessingLocked = false
			client.eventProcessingLockReason = null
			return {
				shardIds: client.shard.ids,
				unlocked: true,
				eventProcessingLocked: false,
				managerSpawnComplete: true,
				readyTasksComplete: client.readyTasksComplete
			}
		}, { context: { action } })
		logger.info({ action: `runtime_event_processing_unlock_broadcast`, trigger: action, results })
		return results
	}

	process.on(`unhandledRejection`, (reason) => {
		const msg = reason && reason.message ? reason.message : String(reason)
		logger.error({ 
			action: `UNHANDLED_REJECTION`,
			msg
		})
	})
	process.on(`uncaughtException`, err => {
		const msg = err && err.message ? err.message : String(err)
		logger.error({ 
			action: `UNCAUGHT_EXCEPTION`,
			msg
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
	await pruneSelfUploadCovers({ logger })
	const { ShardingManager, ShardEvents } = require(`discord.js`)
	const manager = new ShardingManager(`./src/annie.js`, {
		respawn: [`production`, `production_beta`].includes(process.env.NODE_ENV),
		token: process.env.BOT_TOKEN,
		execArgv: [`--trace-warnings`],
	})

	const server = express()
	require(`./api`)(server)
	manager.on(`shardCreate`, shard => {
		const shardLogger = createLogger.child({ shard: getCustomShardId(shard.id) })
		shard.on(ShardEvents.Death, (p) => {
			shardLogger.error({ action: `shard_died`, msg: p.message })
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
		shard.on(ShardEvents.Message, (message) => shardLogger.trace({ action: `shard_message`, msg: message }))
		shard.on(ShardEvents.Ready, () => {
			shardLogger.info({ action: `shard_ready` })
			if (!initialSpawnComplete) return
			unlockShardRuntimeEvents(manager, `shard_ready_after_initial_spawn`)
				.catch(error => logger.error({
					action: `runtime_event_processing_unlock_after_respawn_failed`,
					shardId: shard.id,
					msg: error && error.message ? error.message : String(error)
				}))
		})
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
		initialSpawnComplete = true
		try {
			await unlockShardRuntimeEvents(manager, `initial_spawn_complete`)
		} catch (error) {
			logger.error({
				action: `runtime_event_processing_unlock_failed`,
				msg: error && error.message ? error.message : String(error)
			})
		}
		try {
			const m = collection.get(0).manager
			const fetchServers = await m.fetchClientValues(`guilds.cache.size`)
			const serverCount = fetchServers.reduce((prev, val) => prev + val, 0)
			const shardCount = m.totalShards
			m.broadcastEval((c, { serverCount, shardCount }) => {
				if (!c.isReady()) return
				if (c.dev) return
				c.dblApi.postStats({ serverCount, shardCount })
			}, { context: { serverCount, shardCount } })
		} catch (error) {
			logger.error({ action: `sequential_shards_spawn_error`, msg: error.message })
		}
	}).catch(error => {
		logger.error({
			action: `sequential_shards_spawn_failed`,
			msg: error && error.message ? error.message : String(error),
			stack: error && error.stack ? error.stack : null
		})
	})

	// Top.gg webhook listener for vote reward system
	const { Webhook } = require(`@top-gg/sdk`)
	// Use real webhook in production, mock in development
	const wh = process.env.NODE_ENV === `development`
		? {
			listener: (callback) => async (req, res) => {
			// In dev mode, either use the request body or generate mock vote data
			const mockVoteData = { user: `230034968515051520`, vote: true }
			await callback(req.body || mockVoteData)
			res.status(200).send(`dummy response`)
			}
		}
		: new Webhook(process.env.DBLWEBHOOK_AUTH)

	server.post(`/dblwebhook`, wh.listener(async vote => {
		const { v7: uuidv7 } = require(`uuid`)
		const userId = vote.user
		const requestId = uuidv7()
		const voteLogger = logger.child({ requestId, userId })
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
				voteLogger.error({ action: `topgg_vote_endpoint_webhook_notification_failed`, msg: error.message })
			}
		}
		else {
			voteLogger.warn({ action: `topgg_vote_endpoint_webhook_unavailable`, targetUrl: process.env.VOTE_WEBHOOK_URL })
		}
		const reward = 5000 * (vote.isWeekend ? 3 : 1)
		// 4. Distribute reward and notify user on a single, available shard.
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
			const results = await manager.broadcastEval(async (client, { userId, requestId, reward }) => {
				// Check if this is the designated shard to perform the actions
				// This ensures the database update and DM sending happen only once
				const currentShardId = client.shard.ids[0]
				if (currentShardId !== 0) return null // Skip if not the target shard
				const voteRewardLogger = client.logger.child({ requestId })
				voteRewardLogger.info({ action: `topgg_vote_endpoint_processing_reward`, reward: reward })
				// 5. Distribute reward
				try {
					await client.db.databaseUtils.updateInventory({
						itemId: 52,
						userId: userId,
						value: reward,
						distributeMultiAccounts: true
					})
					voteRewardLogger.info({ action: `topgg_vote_endpoint_distribute_reward_success` })
				} catch (error) {
					const msg = error && error.message ? error.message : String(error)
					voteRewardLogger.warn({ action: `topgg_vote_endpoint_distribute_reward_failed`, msg })
					return { success: false, userId: userId, error: msg }
				}

				// 6. Attempt to notify the voter (user)
				const artcoinsEmoji = await client.getEmoji(`artcoins`, `577121315480272908`)
				const user = await client.users.fetch(userId) // Fetches user from Discord API. Regardless of the shard, this still works.
				try {
					await user.send(`**⋆. thankyouu for the voting, ${user.username}!** i've sent <${artcoinsEmoji}>**${reward.toLocaleString()}** to your inventory as the reward!\nif you wish to support the development further, feel free to drop by in my support server!\nhttps://discord.gg/HjPHCyG346`)
					voteRewardLogger.info({ action: `topgg_vote_endpoint_reward_notification_success` })
				} catch (e) {
					voteRewardLogger.warn({ action: `topgg_vote_endpoint_reward_notification_failed`, msg: e.message })
				}
				return { success: true, userId: userId } // Indicate successful processing
			}, { context: { userId, requestId, reward } })
			if (!results.some(r => r && r.success)) return voteLogger.warn({ action: `topgg_vote_endpoint_end`, msg:`no success indicator` })
		}
		catch (error) {
			voteLogger.error({ action: `topgg_vote_endpoint_error`, msg: error.message })
		}
	}))
	const port = process.env.PORT || 3000
	server.listen(port, () => logger.info({ action: `LISTENING_TO_PORT`, port }))
}
