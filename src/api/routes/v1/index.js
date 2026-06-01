"use strict"
const path = require(`path`)
const { Router } = require(`express`)
const { listCommands } = require(`../../lib/listCommands`)

/**
 * v1 routes for the private API.
 *
 * @param {object} ctx Shared context — currently just the master logger.
 * @param {import('pino').Logger} ctx.logger
 * @param {string} ctx.basePath
 * @return {import('express').Router}
 */
module.exports = function v1Router({ logger, basePath }) {
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

	return router
}
