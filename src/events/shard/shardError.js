"use strict"
const errorRelay = require(`../../utils/errorHandler`)

/**
 * Gateway handshake rejected by Discord with a 5xx status (e.g. `Unexpected server response: 503`).
 * These come from Discord's side and discord.js reconnects on its own.
 */
const TRANSIENT_HANDSHAKE_ERROR = /^Unexpected server response: 5\d{2}$/
//  A shard hitting this many transient errors inside the window is no longer a blip.
const TRANSIENT_ERROR_THRESHOLD = 5
const TRANSIENT_ERROR_WINDOW_MS = 10 * 60 * 1000
//  shardId -> timestamps (ms) of the recent transient errors
const transientErrorLog = new Map()

/**
 * Whether the error is a transient gateway handshake failure.
 * @param {string} errorMessage
 * @returns {boolean}
 */
const isTransientShardError = (errorMessage) => TRANSIENT_HANDSHAKE_ERROR.test(errorMessage)

/**
 * Records a transient error for the shard and returns how many happened inside the window.
 * @param {number} shardId
 * @param {number} [now=Date.now()]
 * @returns {number}
 */
const trackTransientError = (shardId, now = Date.now()) => {
    const recent = (transientErrorLog.get(shardId) || []).filter(timestamp => now - timestamp < TRANSIENT_ERROR_WINDOW_MS)
    recent.push(now)
    transientErrorLog.set(shardId, recent)
    return recent.length
}

/**
 * Handles a shard's WebSocket error. Transient gateway handshake failures are logged as
 * warnings and only relayed to the support server once they keep repeating; anything else
 * is relayed right away.
 * @param {object} annie Current shard's client instance
 * @param {Error} error
 * @param {number} shardId
 * @returns {void}
 */
module.exports = function shardError(annie, error, shardId) {
    const errorMessage = error?.message || `An unknown error occurred`
    const errorStack = error?.stack || `No stack trace available`
    if (isTransientShardError(errorMessage)) {
        const occurrences = trackTransientError(shardId)
        if (occurrences < TRANSIENT_ERROR_THRESHOLD) {
            annie.logger.warn({ action: `shard_error_transient`, shardId, occurrences, msg: errorMessage })
            return
        }
        //  Persistent: start counting afresh so the relay fires once per threshold, not on every error.
        transientErrorLog.delete(shardId)
        annie.logger.error({ action: `shard_error_persistent`, shardId, occurrences, err: error, msg: errorMessage })
    } else {
        annie.logger.error({ action: `shard_error`, shardId, err: error, msg: errorMessage })
    }
    errorRelay(annie, { fileName: `shardError.js`, errorType: `normal`, error_message: errorMessage, error_stack: errorStack }).catch(err => annie.logger.error({ action: `shard_error_relay_failed`, shardId, err, msg: `Unable to send message to channel` }))
}
module.exports.isTransientShardError = isTransientShardError
module.exports.resetTransientErrorLog = () => transientErrorLog.clear()
module.exports.TRANSIENT_ERROR_THRESHOLD = TRANSIENT_ERROR_THRESHOLD
module.exports.TRANSIENT_ERROR_WINDOW_MS = TRANSIENT_ERROR_WINDOW_MS
