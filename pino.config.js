const pino = require(`pino`)
const fs = require(`fs`)
const path = require(`path`)

/**
 * logger.fatal('fatal'); highest level     level: 60
 * logger.error('error');                   level: 50
 * logger.warn('warn');                     level: 40
 * logger.info('info');                     level: 30
 * logger.debug('debug');                   level: 20
 * logger.trace('trace'); lowest level      level: 10
 * 
 * EACH level goes up by ten
 */

/**
 * Emergency (emerg): system is unusable.
 * Alert (alert): immediate action required.
 * Critical (crit): critical conditions.
 * Error (error): error conditions.
 * Warning (warn): warning conditions.
 * Notice (notice): normal but significant conditions.
 * Informational (info): informational messages.
 * Debug (debug): messages helpful for debugging.
 */

// Environment configuration
const isDevelopment = process.env.NODE_ENV === `development`
const shouldStreamToFiles = process.env.STREAM_LOGS_TO_FILES === `1`
const logLevel = process.env.LOGS_LEVEL || (isDevelopment ? `debug` : `info`)

// Ensure logs directory exists if streaming to files
const logsDir = path.join(process.cwd(), `.logs`)
if (shouldStreamToFiles && !fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

/** 
 * Custom levels
 * Dont use 10, 20, 30, 40, 50, 60
 */
const levels = {
    database: isDevelopment ? 31 : 29 // Any number between info (30) and warn (40) will work the same
}

/**
 * Creates file stream destination with log rotation
 * @param {string} loggerName - Name of the logger for filename
 * @returns {object} Pino destination stream
 */
function createFileDestination(loggerName) {
    if (!shouldStreamToFiles) {
        return undefined
    }

    try {
        const logFile = path.join(logsDir, `${loggerName.toLowerCase()}.log`)
        
        // Use pino.destination for basic file output first
        // We can add rotation later if needed
        return pino.destination({
            dest: logFile,
            sync: false
        })
    } catch (error) {
        console.error(`Failed to create file destination for ${loggerName}:`, error.message)
        return undefined
    }
}

/**
 * Creates logger options with standardized configuration
 * @param {string} loggerName - Name of the logger
 * @returns {object} Pino logger options or array with destination
 */
function createLoggerOptions(loggerName) {
    const baseOptions = {
        formatters: {
            bindings: (bindings) => {
                return { name: bindings.name }
            },
            level: (label) => {
                return {
                    level: label  // Show the label instead of a number
                }
            }
        },
        name: loggerName,
        level: logLevel,
        customLevels: levels,
        timestamp: pino.stdTimeFunctions.isoTime
    }

    // Add file destination if enabled
    const fileDestination = createFileDestination(loggerName)
    if (fileDestination) {
        return [baseOptions, fileDestination]
    }

    return baseOptions
}

// Create loggers with enhanced configuration
const masterLoggerArgs = createLoggerOptions(`MASTER_SHARD`)
const masterLogger = Array.isArray(masterLoggerArgs) ? pino(...masterLoggerArgs) : pino(masterLoggerArgs)

const databaseLoggerArgs = createLoggerOptions(`DATABASE`)
const databaseLogger = Array.isArray(databaseLoggerArgs) ? pino(...databaseLoggerArgs) : pino(databaseLoggerArgs)

const localizerLoggerArgs = createLoggerOptions(`LOCALIZER`)
const localizerLogger = Array.isArray(localizerLoggerArgs) ? pino(...localizerLoggerArgs) : pino(localizerLoggerArgs)

const shardLogger = (name) => {
    const shardLoggerArgs = createLoggerOptions(name)
    return Array.isArray(shardLoggerArgs) ? pino(...shardLoggerArgs) : pino(shardLoggerArgs)
}

module.exports = { databaseLogger, masterLogger, localizerLogger, shardLogger }