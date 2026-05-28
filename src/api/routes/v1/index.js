"use strict"
const { Router } = require(`express`)

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

	return router
}
