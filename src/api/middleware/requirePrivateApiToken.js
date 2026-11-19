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
		const result = checkAuthorizationHeader(req.get(`authorization`))
		if (result.ok) return next()
		if (result.error === `private_api_unconfigured`) {
			logger.warn({ action: `private_api_unconfigured`, path: req.path })
		}
		if (result.error === `invalid_token`) {
			logger.warn({ action: `private_api_unauthorized`, path: req.path, ip: req.ip, tokenSource: result.source })
		}
		return res.status(result.status).json({ ok: false, error: result.error })
	}
}

/**
 * Validate a raw `Authorization` header against the configured token.
 * Shared by the Express gate above and the WebSocket upgrade handler, which
 * never passes through Express middleware.
 *
 * @param {string} [header]
 * @return {{ ok: boolean, status: number, error: string|null, source: string|null }}
 */
function checkAuthorizationHeader(header) {
	const { expected, source } = getConfiguredToken()
	if (!expected) return { ok: false, status: 503, error: `private_api_unconfigured`, source }

	const match = (header || ``).match(/^Bearer\s+(.+)$/i)
	if (!match) return { ok: false, status: 401, error: `missing_bearer_token`, source }

	if (!constantTimeEqual(match[1], expected)) return { ok: false, status: 401, error: `invalid_token`, source }

	return { ok: true, status: 200, error: null, source }
}
module.exports.checkAuthorizationHeader = checkAuthorizationHeader

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
