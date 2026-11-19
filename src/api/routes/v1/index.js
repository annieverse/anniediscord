"use strict"
const path = require(`path`)
const { Router } = require(`express`)
const { listCommands } = require(`../../lib/listCommands`)
const { collectShardStatus } = require(`../../lib/shardStatus`)
const requireLoopback = require(`../../middleware/requireLoopback`)

/**
 * v1 routes for the private API.
 *
 * @param {object} ctx Shared context — currently just the master logger.
 * @param {import('pino').Logger} ctx.logger
 * @param {string} ctx.basePath
 * @param {import('discord.js').ShardingManager} [ctx.manager]
 * @return {import('express').Router}
 */
module.exports = function v1Router({ logger, basePath, manager = null }) {
	const router = Router()

	/**
	 * Health-check / liveness probe. Confirms the master process is reachable
	 * and the bearer token is valid.
	 */
	router.get(`/ping`, (req, res) => {
		const requestId = req.get(`x-request-id`) || null
		logger.debug({ action: `private_api_v1_ping`, requestId })
		return res.status(200).json({
			ok: true,
			service: `annie`,
			api: `private`,
			version: 1,
			basePath,
			uptimeSeconds: Math.round(process.uptime()),
			timestamp: new Date().toISOString()
		})
	})

	/**
	 * Returns every available command's structured metadata, keyed by file
	 * basename (no extension). Function-shaped fields (execute/Iexecute/run
	 * plus any helper methods on the module) are omitted; everything else —
	 * description, usage, aliases, options, type, permissionLevel, group,
	 * etc. — is preserved as-declared in the command file.
	 */
	router.get(`/commands`, (req, res) => {
		const requestId = req.get(`x-request-id`) || null
		try {
			const commandsDir = path.resolve(__dirname, `../../../commands`)
			const commands = listCommands(commandsDir)
			logger.debug({ action: `private_api_v1_commands`, count: Object.keys(commands).length, requestId })
			return res.status(200).json({ ok: true, count: Object.keys(commands).length, commands })
		} catch (err) {
			logger.error({ action: `private_api_v1_commands_failed`, msg: err.message, stack: err.stack, requestId })
			return res.status(500).json({ ok: false, error: `commands_listing_failed` })
		}
	})

	//  Shard data is for the dashboard running on this same host only, so on
	//  top of the bearer token these routes refuse any non-local caller.
	router.use(`/shards`, requireLoopback({ logger }))

	/**
	 * The realtime feed lives on this path as a WebSocket (see
	 * `src/api/realtime/shardStream.js`). A plain GET lands here.
	 */
	router.get(`/shards/stream`, (req, res) => {
		res.set(`Upgrade`, `websocket`)
		return res.status(426).json({ ok: false, error: `websocket_upgrade_required` })
	})

	/**
	 * Live snapshot of every spawned shard: id, number, codename, gateway
	 * ping, how long the master waited for the shard to answer, and guild
	 * counts (per shard and in total).
	 */
	router.get(`/shards`, async (req, res) => {
		const requestId = req.get(`x-request-id`) || null
		if (!manager) return res.status(503).json({ ok: false, error: `shard_manager_unavailable` })
		try {
			const snapshot = await collectShardStatus(manager)
			logger.debug({ action: `private_api_v1_shards`, shards: snapshot.spawnedShards, requestId })
			return res.status(200).json({ ok: true, ...snapshot })
		} catch (err) {
			logger.error({ action: `private_api_v1_shards_failed`, msg: err.message, stack: err.stack, requestId })
			return res.status(500).json({ ok: false, error: `shard_status_failed` })
		}
	})

	/**
	 * Same data as `/shards`, narrowed to one shard by its zero-based id.
	 */
	router.get(`/shards/:id`, async (req, res) => {
		const requestId = req.get(`x-request-id`) || null
		if (!manager) return res.status(503).json({ ok: false, error: `shard_manager_unavailable` })
		if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ ok: false, error: `invalid_shard_id` })
		const shardId = parseInt(req.params.id, 10)
		try {
			const snapshot = await collectShardStatus(manager)
			const shard = snapshot.shards.find(entry => entry.id === shardId)
			if (!shard) return res.status(404).json({ ok: false, error: `shard_not_found` })
			return res.status(200).json({ ok: true, timestamp: snapshot.timestamp, shard })
		} catch (err) {
			logger.error({ action: `private_api_v1_shard_failed`, shardId, msg: err.message, stack: err.stack, requestId })
			return res.status(500).json({ ok: false, error: `shard_status_failed` })
		}
	})

	return router
}
