const pino = require(`pino`)
const fs = require(`fs`)
const path = require(`path`)

/**
 * Logger v2 structure.
 * You can still use the legacy-way of logging by passing the string immediately as the first parameter
 * Which is what half of our logs in the codebase are still using this and stays untouched unless we needed
 * more context thru new structure.
 * @example logger.info(`User <@123> just got 10 exp.`)  <-- legacy, but still works.
 * @example logger.info({ action: `user_receive_exp`, userId, exp })  <-- v2 structure
 * @example logger.info({ action: `user_receive_exp`, msg: `someone just got exp`, userId, exp })  <-- v2 with additional msg context
 *
 * A few new properties that are recommended to be included in the new v2 logger (NOT MANDATORY):
 * @property action {string} Can be used as a way to shortly describe what process being ran in the style of REST API
 * @property requestId {string} The unique identifier for the process being logged. Standardize to use v7 UUID.
 * @property durationMs {string} The duration of the process being logged in milliseconds. Mostly for benchmarking; low priority.
 *
 * Q: How do to enable streaming the logs to file?
 * A: Use STREAM_LOG_TO_FILE=1 (1 to enable, blank/0 for disable) in environment variable.
 *
 * Q: How do I add custom fields to my logs?
 * A: You can add custom fields by including them in the log object, e.g. logger.info({ userId, action: 'user_login' })
 *
 * Q: How do I change the log level?
 * A: You can change the log level by setting the LOG_LEVEL environment variable, e.g. LOG_LEVEL=debug
 */

/**
 * Build file destination (optional)
 * @returns {import('stream').Writable|undefined}
 */
const buildFileDestination = () => {
    if (process.env.STREAM_LOG_TO_FILE !== `1`) return
    const logsDir = path.resolve(`./logs`)
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    const today = new Date().toLocaleDateString(`en-GB`, {
        day: `2-digit`,
        month: `2-digit`,
        year: `numeric`
    }).replace(/\//g, `-`)
    const logFilePath = path.join(logsDir, `${today}.json`)
    return pino.destination({ dest: logFilePath, mkdir: true, sync: false })
}

/**
 * Build terminal stream for both dev and production
 * @returns {import('stream').Writable|undefined}
 */
const buildTerminalStream = () => {
    return pino.transport({
        target: `pino-pretty`,
        options: {
            colorize: true,
            translateTime: `HH:MM:ss.l Z`,
            ignore: `pid,hostname`,
            singleLine: true,
            errorLikeObjectKeys: [`err`, `error`]
        }
    })
}

/**
 * Create logger with level labels in JSON output
 * @returns {import('pino').Logger}
 */
const createLogger = () => {
    const levelSetting = process.env.LOG_LEVEL || (process.env.NODE_ENV === `production` ? `info` : `debug`)
    const options = {
        base: {},
        level: levelSetting,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            // Return label instead of numeric code
            level: (label) => ({ level: label }),
            bindings: () => ({})
        }
    }
    const fileDest = buildFileDestination()
    const terminalStream = buildTerminalStream()
    if (fileDest && terminalStream) {
        return pino(options, pino.multistream([
            { level: levelSetting, stream: fileDest },
            { level: levelSetting, stream: terminalStream }
        ]))
    }
    if (fileDest) return pino(options, fileDest)
    if (terminalStream) return pino(options, terminalStream)
    return pino(options) // fallback
}
module.exports = createLogger()
