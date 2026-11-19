"use strict"

//  A request relayed by a reverse proxy on this host also arrives from
//  127.0.0.1, so the socket address alone cannot tell it apart from a truly
//  local caller. Proxies announce themselves with these headers; a local
//  client calling Annie directly has no reason to send them.
const FORWARDING_HEADERS = [`x-forwarded-for`, `forwarded`, `x-real-ip`]

/**
 * @param {string} address
 * @return {boolean}
 */
function isLoopbackAddress(address) {
	if (typeof address !== `string`) return false
	const normalized = address.startsWith(`::ffff:`) ? address.slice(7) : address
	return normalized === `::1` || /^127(\.\d{1,3}){3}$/.test(normalized)
}

/**
 * True when the request was opened from this same host and was not relayed
 * by a proxy. Reads the raw socket address on purpose: `req.ip` follows
 * Express' `trust proxy` setting and can be spoofed through headers.
 *
 * @param {import('http').IncomingMessage} req
 * @return {boolean}
 */
function isLoopbackRequest(req) {
	const address = req && req.socket ? req.socket.remoteAddress : null
	if (!isLoopbackAddress(address)) return false
	const headers = req.headers || {}
	return !FORWARDING_HEADERS.some(header => headers[header])
}

/**
 * Create a gate that only lets same-host callers through.
 *
 * @param {object} ctx
 * @param {import('pino').Logger} ctx.logger
 * @return {Function}
 */
module.exports = function requireLoopback({ logger }) {
	return function loopbackMiddleware(req, res, next) {
		if (isLoopbackRequest(req)) return next()
		logger.warn({
			action: `private_api_non_local_request_refused`,
			path: req.path,
			remoteAddress: req.socket ? req.socket.remoteAddress : null
		})
		return res.status(403).json({ ok: false, error: `local_requests_only` })
	}
}
module.exports.isLoopbackAddress = isLoopbackAddress
module.exports.isLoopbackRequest = isLoopbackRequest
