"use strict"
const express = require(`express`)
const requirePrivateApiToken = require(`./middleware/requirePrivateApiToken.js`)
const v1Router = require(`./routes/v1`)
const createLogger = require(`../../pino.config.js`)

const DEFAULT_BASE_PATH = `/api`
const DEFAULT_BODY_LIMIT = `64kb`

/**
 * Mount Annie's private API onto an existing Express app.
 *
 * Auth: every route under the configured base path requires a `Bearer` token.
 * Prefer `PRIVATE_API_TOKEN`; `DASHBOARD_API_TOKEN` is still accepted as a
 * legacy fallback for existing dashboard deployments. If neither env var is
 * set, the API refuses all traffic with 503.
 *
 * Versioning: routes live under `/api/v1/*`. New versions add a sibling
 * directory under `routes/` rather than mutating v1.
 *
 * @param {import('express').Application} server The Express app from master.js.
 * @param {object} [options]
 * @param {string} [options.basePath]
 * @param {string} [options.bodyLimit]
 * @return {void}
 */
module.exports = function mountPrivateApi(server, options = {}) {
	const basePath = options.basePath || DEFAULT_BASE_PATH
	const bodyLimit = options.bodyLimit || DEFAULT_BODY_LIMIT
	const logger = createLogger.child({ module: `private_api` })
	const auth = requirePrivateApiToken({ logger })
	const context = { logger, basePath }

	//  Auth gate first — every downstream route requires the bearer token.
	server.use(basePath, auth)

	//  Body parser scoped to the private API mount so it doesn't affect
	//  the existing top.gg webhook on /dblwebhook.
	server.use(basePath, express.json({ limit: bodyLimit }))

	server.use(`${basePath}/v1`, v1Router(context))

	logger.info({ action: `private_api_mounted`, basePath: `${basePath}/v1` })
}
