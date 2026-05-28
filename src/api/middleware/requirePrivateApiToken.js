"use strict"

const TOKEN_ENV_KEYS = [`PRIVATE_API_TOKEN`]

/**
 * Create a bearer-token auth gate for the private API.
 *
 * @param {object} ctx
 * @param {import('pino').Logger} ctx.logger
 * @return {Function}
 */
module.exports = function requirePrivateApiToken({ logger }) {
	return function privateApiTokenMiddleware(req, res, next) {
		const { expected, source } = getConfiguredToken()
		if (!expected) {
			logger.warn({ action: `private_api_unconfigured`, path: req.path })
			return res.status(503).json({ ok: false, error: `private_api_unconfigured` })
		}

		const header = req.get(`authorization`) || ``
		const match = header.match(/^Bearer\s+(.+)$/i)
		if (!match) return res.status(401).json({ ok: false, error: `missing_bearer_token` })

		const supplied = match[1]
		if (!constantTimeEqual(supplied, expected)) {
			logger.warn({ action: `private_api_unauthorized`, path: req.path, ip: req.ip, tokenSource: source })
			return res.status(401).json({ ok: false, error: `invalid_token` })
		}

		return next()
	}
}

/**
 * @return {{ expected: string|null, source: string|null }}
 */
function getConfiguredToken() {
	for (const key of TOKEN_ENV_KEYS) {
		if (process.env[key]) return { expected: process.env[key], source: key }
	}
	return { expected: null, source: null }
}

/**
 * Compare two strings in constant time relative to their length.
 *
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
function constantTimeEqual(a, b) {
	if (typeof a !== `string` || typeof b !== `string`) return false
	if (a.length !== b.length) return false
	let mismatch = 0
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
	}
	return mismatch === 0
}
