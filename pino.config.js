const pino = require(`pino`)
const fs = require(`fs`)
const path = require(`path`)

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
