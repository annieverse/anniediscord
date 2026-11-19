"use strict"
const shardNames = require(`../../config/shardName.json`)

const DEFAULT_PROBE_TIMEOUT_MS = 5000

/**
 * Runs INSIDE a shard process through `shard.eval`. It is serialized with
 * `toString()`, so it must stay self-contained: no closures, no requires.
 *
 * @param {import('discord.js').Client} client
 * @return {object}
 */
function probeShardClient(client) {
	return {
		ready: typeof client.isReady === `function` ? client.isReady() : false,
		gatewayPingMs: client.ws ? client.ws.ping : null,
		guildCount: client.guilds.cache.size,
		uptimeMs: client.uptime,
		eventProcessingLocked: client.eventProcessingLocked === true
	}
}

/**
 * Static identity of a shard: Discord's zero-based id, the one-based number
 * shown to humans, and the codename from `src/config/shardName.json`.
 *
 * @param {number} id
 * @return {{ id: number, number: number, codename: string|null, label: string }}
 */
function describeShard(id) {
	const codename = shardNames[id] || null
	return { id, number: id + 1, codename, label: `${id}/${codename}` }
}

/**
 * Ask one shard for its live state. Never rejects: a shard that is dead,
 * still booting or too slow is reported as `unavailable` instead, so one bad
 * shard cannot blank out the whole snapshot.
 *
 * @param {import('discord.js').Shard} shard
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {Function} [options.now]
 * @return {Promise<object>}
 */
async function probeShard(shard, { timeoutMs = DEFAULT_PROBE_TIMEOUT_MS, now = Date.now } = {}) {
	const identity = describeShard(shard.id)
	const startedAt = now()
	let timer = null
	try {
		const timeout = new Promise((resolve, reject) => {
			timer = setTimeout(() => reject(new Error(`shard_probe_timeout`)), timeoutMs)
		})
		const probe = Promise.resolve().then(() => shard.eval(probeShardClient))
		const result = await Promise.race([probe, timeout])
		const ping = Number.isFinite(result.gatewayPingMs) && result.gatewayPingMs >= 0
			? Math.round(result.gatewayPingMs)
			: null
		return {
			...identity,
			status: result.ready ? `online` : `connecting`,
			gatewayPingMs: ping,
			retrievalLatencyMs: now() - startedAt,
			guildCount: Number.isFinite(result.guildCount) ? result.guildCount : 0,
			uptimeMs: Number.isFinite(result.uptimeMs) ? result.uptimeMs : null,
			eventProcessingLocked: result.eventProcessingLocked === true,
			error: null
		}
	} catch (error) {
		return {
			...identity,
			status: `unavailable`,
			gatewayPingMs: null,
			retrievalLatencyMs: now() - startedAt,
			guildCount: 0,
			uptimeMs: null,
			eventProcessingLocked: null,
			error: error && error.message ? error.message : String(error)
		}
	} finally {
		clearTimeout(timer)
	}
}

/**
 * Build a live snapshot of every spawned shard.
 *
 * Shards are probed one by one with `shard.eval` instead of
 * `manager.broadcastEval`, because the latter rejects outright while the
 * manager is still spawning and fails as a whole when a single shard is down.
 *
 * @param {import('discord.js').ShardingManager} manager
 * @param {object} [options]
 * @param {number} [options.timeoutMs] Per-shard probe timeout.
 * @param {Function} [options.now]
 * @return {Promise<object>}
 */
async function collectShardStatus(manager, options = {}) {
	const now = options.now || Date.now
	const startedAt = now()
	const spawned = [...manager.shards.values()].sort((a, b) => a.id - b.id)
	const shards = await Promise.all(spawned.map(shard => probeShard(shard, options)))
	const pings = shards.map(shard => shard.gatewayPingMs).filter(ping => ping !== null)
	return {
		timestamp: new Date(now()).toISOString(),
		totalShards: Number.isFinite(manager.totalShards) ? manager.totalShards : shards.length,
		spawnedShards: shards.length,
		onlineShards: shards.filter(shard => shard.status === `online`).length,
		totalGuilds: shards.reduce((total, shard) => total + shard.guildCount, 0),
		averageGatewayPingMs: pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null,
		retrievalLatencyMs: now() - startedAt,
		shards
	}
}

module.exports = { collectShardStatus, probeShard, describeShard, DEFAULT_PROBE_TIMEOUT_MS }
