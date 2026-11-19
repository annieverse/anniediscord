"use strict"
const http = require(`http`)
const { WebSocketServer } = require(`ws`)
const { collectShardStatus } = require(`../lib/shardStatus`)
const { isLoopbackRequest } = require(`../middleware/requireLoopback`)
const { checkAuthorizationHeader } = require(`../middleware/requirePrivateApiToken`)

const DEFAULT_PATH = `/api/v1/shards/stream`
const DEFAULT_INTERVAL_MS = 5000
const MIN_INTERVAL_MS = 1000
const DEFAULT_HEARTBEAT_MS = 30000
const DEFAULT_MAX_CLIENTS = 10
const LIFECYCLE_REFRESH_DELAY_MS = 250
const SOCKET_OPEN = 1
//  Shard lifecycle changes worth pushing right away instead of waiting for
//  the next interval.
const REFRESH_EVENTS = [`spawn`, `ready`, `death`, `disconnect`, `reconnecting`, `resume`]

/**
 * Refuse a WebSocket upgrade with a plain HTTP response.
 *
 * @param {import('stream').Duplex} socket
 * @param {number} status
 * @param {string} error
 * @return {void}
 */
function rejectUpgrade(socket, status, error) {
	const body = JSON.stringify({ ok: false, error })
	socket.end(
		`HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\n` +
		`Content-Type: application/json\r\n` +
		`Content-Length: ${Buffer.byteLength(body)}\r\n` +
		`Connection: close\r\n\r\n${body}`
	)
}

/**
 * Serve live shard snapshots over WebSocket on the master's HTTP server.
 *
 * The same rules as the HTTP route apply before the upgrade is accepted:
 * same-host caller, then `Authorization: Bearer <PRIVATE_API_TOKEN>`.
 * Every client shares one poller, which only runs while someone is connected.
 * Messages are JSON: `{ type: 'shards', data: <snapshot> }` or
 * `{ type: 'error', error: 'shard_status_failed' }`.
 *
 * @param {import('http').Server} httpServer The server returned by `server.listen()`.
 * @param {object} options
 * @param {import('discord.js').ShardingManager} options.manager
 * @param {import('pino').Logger} options.logger
 * @param {string} [options.path]
 * @param {number} [options.intervalMs]
 * @param {number} [options.heartbeatMs]
 * @param {number} [options.probeTimeoutMs]
 * @param {number} [options.maxClients]
 * @return {{ wss: import('ws').WebSocketServer, close: Function }}
 */
module.exports = function attachShardStream(httpServer, options) {
	const { manager, logger } = options
	const path = options.path || DEFAULT_PATH
	const intervalMs = Number.isFinite(options.intervalMs)
		? Math.max(options.minIntervalMs || MIN_INTERVAL_MS, options.intervalMs)
		: DEFAULT_INTERVAL_MS
	const heartbeatMs = options.heartbeatMs || DEFAULT_HEARTBEAT_MS
	const maxClients = options.maxClients || DEFAULT_MAX_CLIENTS
	const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 })
	let pollTimer = null
	let heartbeatTimer = null
	let polling = false
	let closed = false

	/**
	 * @param {object} payload
	 * @return {void}
	 */
	function broadcast(payload) {
		const message = JSON.stringify(payload)
		for (const client of wss.clients) {
			if (client.readyState === SOCKET_OPEN) client.send(message)
		}
	}

	/**
	 * Queue the next snapshot. A shorter delay replaces a pending longer one.
	 *
	 * @param {number} delay
	 * @return {void}
	 */
	function schedule(delay) {
		if (closed || polling || !wss.clients.size) return
		if (pollTimer) clearTimeout(pollTimer)
		pollTimer = setTimeout(poll, delay)
	}

	/**
	 * @return {Promise<void>}
	 */
	async function poll() {
		pollTimer = null
		if (closed || !wss.clients.size) return
		polling = true
		try {
			const data = await collectShardStatus(manager, { timeoutMs: options.probeTimeoutMs })
			broadcast({ type: `shards`, data })
		} catch (error) {
			logger.error({ action: `private_api_shard_stream_poll_failed`, msg: error.message, stack: error.stack })
			broadcast({ type: `error`, error: `shard_status_failed` })
		} finally {
			polling = false
			schedule(intervalMs)
		}
	}

	/**
	 * Drop clients that stopped answering pings, then ping the rest.
	 *
	 * @return {void}
	 */
	function heartbeat() {
		for (const client of wss.clients) {
			if (client.isAlive === false) {
				client.terminate()
				continue
			}
			client.isAlive = false
			client.ping()
		}
	}

	/**
	 * @return {void}
	 */
	function stopTimers() {
		clearTimeout(pollTimer)
		clearInterval(heartbeatTimer)
		pollTimer = null
		heartbeatTimer = null
	}

	/**
	 * @param {import('discord.js').Shard} shard
	 * @return {void}
	 */
	function watchShard(shard) {
		for (const event of REFRESH_EVENTS) {
			shard.on(event, () => schedule(LIFECYCLE_REFRESH_DELAY_MS))
		}
	}

	wss.on(`connection`, (client, req) => {
		client.isAlive = true
		client.on(`pong`, () => { client.isAlive = true })
		client.on(`error`, error => logger.warn({ action: `private_api_shard_stream_client_error`, msg: error.message }))
		client.on(`close`, () => {
			logger.debug({ action: `private_api_shard_stream_client_closed`, clients: wss.clients.size })
			if (!wss.clients.size) stopTimers()
		})
		logger.info({
			action: `private_api_shard_stream_client_connected`,
			clients: wss.clients.size,
			requestId: req.headers[`x-request-id`] || null
		})
		if (!heartbeatTimer) heartbeatTimer = setInterval(heartbeat, heartbeatMs)
		//  Push a first snapshot right away instead of making the client
		//  wait a full interval.
		schedule(0)
	})

	httpServer.on(`upgrade`, (req, socket, head) => {
		let pathname = null
		try {
			pathname = new URL(req.url, `http://localhost`).pathname
		} catch (error) {
			return rejectUpgrade(socket, 400, `bad_request`)
		}
		//  This is the only upgrade endpoint on the master. When another one
		//  is added, hand unknown paths over instead of refusing them here.
		if (pathname !== path) return rejectUpgrade(socket, 404, `not_found`)
		if (!isLoopbackRequest(req)) {
			logger.warn({ action: `private_api_non_local_request_refused`, path: pathname, remoteAddress: socket.remoteAddress })
			return rejectUpgrade(socket, 403, `local_requests_only`)
		}
		const auth = checkAuthorizationHeader(req.headers.authorization)
		if (!auth.ok) {
			logger.warn({ action: `private_api_shard_stream_refused`, reason: auth.error, tokenSource: auth.source })
			return rejectUpgrade(socket, auth.status, auth.error)
		}
		if (!manager) return rejectUpgrade(socket, 503, `shard_manager_unavailable`)
		if (wss.clients.size >= maxClients) return rejectUpgrade(socket, 503, `too_many_stream_clients`)
		wss.handleUpgrade(req, socket, head, client => wss.emit(`connection`, client, req))
	})

	if (manager) {
		for (const shard of manager.shards.values()) watchShard(shard)
		manager.on(`shardCreate`, watchShard)
	}

	logger.info({ action: `private_api_shard_stream_attached`, path, intervalMs })

	return {
		wss,
		/**
		 * Stop polling and disconnect every client.
		 *
		 * @return {void}
		 */
		close() {
			closed = true
			stopTimers()
			for (const client of wss.clients) client.terminate()
			wss.close()
		}
	}
}
module.exports.DEFAULT_PATH = DEFAULT_PATH
module.exports.DEFAULT_INTERVAL_MS = DEFAULT_INTERVAL_MS
