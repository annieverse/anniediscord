"use strict"
const express = require(`express`)
const requirePrivateApiToken = require(`./middleware/requirePrivateApiToken.js`)
const v1Router = require(`./routes/v1`)
const attachShardStream = require(`./realtime/shardStream.js`)
const createLogger = require(`../../pino.config.js`)

const DEFAULT_BASE_PATH = `/api`
const DEFAULT_BODY_LIMIT = `64kb`

/**
 * Mount Annie's private API onto an existing Express app.
 *
 * Auth: every route under the configured base path requires a `Bearer` token
 * matching `PRIVATE_API_TOKEN`. If the env var is not set, the API refuses
 * all traffic with 503.
 *
 * Versioning: routes live under `/api/v1/*`. New versions add a sibling
 * directory under `routes/` rather than mutating v1.
 *
 * @param {import('express').Application} server The Express app from master.js.
 * @param {object} [options]
 * @param {string} [options.basePath]
 * @param {string} [options.bodyLimit]
 * @param {import('discord.js').ShardingManager} [options.manager] Needed by
 * routes that read live bot state (the master has no Discord client).
 * @return {void}
 */
module.exports = function mountPrivateApi(server, options = {}) {
	const basePath = options.basePath || DEFAULT_BASE_PATH
	const bodyLimit = options.bodyLimit || DEFAULT_BODY_LIMIT
	const logger = createLogger.child({ module: `private_api` })
	const auth = requirePrivateApiToken({ logger })
	const context = { logger, basePath, manager: options.manager || null }

	//  Auth gate first — every downstream route requires the bearer token.
	server.use(basePath, auth)

	//  Body parser scoped to the private API mount so it doesn't affect
	//  the existing top.gg webhook on /dblwebhook.
	server.use(basePath, express.json({ limit: bodyLimit }))

	server.use(`${basePath}/v1`, v1Router(context))

	logger.info({ action: `private_api_mounted`, basePath: `${basePath}/v1` })
}

/**
 * Attach the private API's WebSocket endpoints to the HTTP server that
 * `server.listen()` returns. Express never sees upgrade requests, so this is
 * wired separately from `mountPrivateApi`.
 *
 * `SHARD_STREAM_INTERVAL_MS` sets how often shard snapshots are pushed
 * (default 5000, minimum 1000).
 *
 * @param {import('http').Server} httpServer
 * @param {object} [options]
 * @param {string} [options.basePath]
 * @param {import('discord.js').ShardingManager} [options.manager]
 * @return {{ wss: import('ws').WebSocketServer, close: Function }}
 */
module.exports.attachRealtime = function attachPrivateApiRealtime(httpServer, options = {}) {
	const basePath = options.basePath || DEFAULT_BASE_PATH
	const logger = createLogger.child({ module: `private_api` })
	const intervalMs = parseInt(process.env.SHARD_STREAM_INTERVAL_MS, 10)
	return attachShardStream(httpServer, {
		manager: options.manager || null,
		logger,
		path: `${basePath}/v1/shards/stream`,
		intervalMs: Number.isFinite(intervalMs) ? intervalMs : undefined
	})
}
