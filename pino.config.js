const pino = require(`pino`)
const fs = require(`fs`)
const path = require(`path`)
const { scheduleLogCleanup } = require(`./src/utils/logRotation`)
const { createStructuredLog, validateStructuredLog } = require(`./src/utils/structuredLogger`)

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

// Determine if running in production or development
const isDevelopment = process.env.NODE_ENV === `development`
const shouldStreamToFiles = process.env.STREAM_LOGS_TO_FILES === `1`
const logLevel = process.env.LOGS_LEVEL || (isDevelopment ? `debug` : `info`)

// Ensure logs directory exists
const logsDir = path.resolve(`./.logs`)
if (shouldStreamToFiles && !fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

// Start log rotation if streaming to files (will be initialized after loggers are created)
let logRotationLogger = null

/** 
 * Custom levels
 * Dont use 10, 20, 30, 40, 50, 60
 */
const levels = {
    database: isDevelopment ? 31 : 29 // Any number between info (30) and warn (40) will work the same
}

/**
 * Create transport configuration based on environment
 */
function createTransport(loggerName) {
    const transports = []

    if (shouldStreamToFiles) {
        // File streaming with daily rotation
        const logFileName = `${loggerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`
        const logFilePath = path.join(logsDir, logFileName)
        
        transports.push({
            target: `pino/file`,
            options: {
                destination: logFilePath
            }
        })
    }

    if (isDevelopment) {
        // Development: pretty print to console
        transports.push({
            target: `pino-pretty`,
            options: {
                colorize: true,
                translateTime: `HH:MM:ss Z`,
                ignore: `pid,hostname`
            }
        })
    }

    // Return appropriate transport configuration
    if (transports.length === 0) {
        return undefined
    } else if (transports.length === 1) {
        return transports[0]
    } else {
        return { targets: transports }
    }
}

/**
 * Creates a logger wrapper that accepts both legacy string messages and new structured objects
 * @param {Object} pinoLogger - The base pino logger instance
 * @returns {Object} Wrapped logger with enhanced functionality
 */
function createEnhancedLogger(pinoLogger) {
    const enhancedLogger = {}
    
    // Create wrapper methods for each log level
    const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'database']
    
    logLevels.forEach(level => {
        /**
         * Enhanced logging method that accepts both strings and objects
         * @param {string|Object} message - Log message (DEPRECATED: use object format) or structured log object
         * @param {...any} args - Additional arguments for string format (legacy)
         * @deprecated String format is deprecated. Use structured object format instead.
         */
        enhancedLogger[level] = function(message, ...args) {
            // Handle object format (new structured logging)
            if (typeof message === 'object' && message !== null) {
                try {
                    validateStructuredLog(message)
                    // Object is valid, log it directly
                    pinoLogger[level](message)
                } catch (error) {
                    // Object validation failed, create a structured log with error context
                    const errorLog = createStructuredLog({
                        action: 'logger_validation_failed',
                        context: {
                            originalMessage: message,
                            validationError: error.message
                        }
                    })
                    pinoLogger.error(errorLog)
                }
                return
            }
            
            // Handle string format (legacy - deprecated)
            if (typeof message === 'string') {
                // Create structured log for legacy string message
                const legacyLog = createStructuredLog({
                    action: 'legacy_log_message',
                    context: args.length > 0 ? { message, args } : message
                })
                pinoLogger[level](legacyLog)
                return
            }
            
            // Handle other types (fallback)
            const fallbackLog = createStructuredLog({
                action: 'unsupported_log_format',
                context: { message, args }
            })
            pinoLogger[level](fallbackLog)
        }
    })
    
    // Pass through other pino methods and properties
    Object.keys(pinoLogger).forEach(key => {
        if (!enhancedLogger[key] && typeof pinoLogger[key] === 'function') {
            enhancedLogger[key] = pinoLogger[key].bind(pinoLogger)
        } else if (!enhancedLogger[key]) {
            enhancedLogger[key] = pinoLogger[key]
        }
    })
    
    return enhancedLogger
}

const defaultOptions = {
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
    name: `MASTER_SHARD`,
    level: logLevel,
    customLevels: levels,
    timestamp: pino.stdTimeFunctions.isoTime
}

// Create logger instances with transport configuration and enhanced functionality
defaultOptions.name = `MASTER_SHARD`
const masterTransport = createTransport(`MASTER_SHARD`)
const baseMasterLogger = masterTransport ? pino(defaultOptions, pino.transport(masterTransport)) : pino(defaultOptions)
const masterLogger = createEnhancedLogger(baseMasterLogger)

defaultOptions.name = `DATABASE`
const databaseTransport = createTransport(`DATABASE`)
const baseDatabaseLogger = databaseTransport ? pino(defaultOptions, pino.transport(databaseTransport)) : pino(defaultOptions)
const databaseLogger = createEnhancedLogger(baseDatabaseLogger)

defaultOptions.name = `LOCALIZER`
const localizerTransport = createTransport(`LOCALIZER`)
const baseLocalizerLogger = localizerTransport ? pino(defaultOptions, pino.transport(localizerTransport)) : pino(defaultOptions)
const localizerLogger = createEnhancedLogger(baseLocalizerLogger)

const shardLogger = (name) => {
    defaultOptions.name = name
    const shardTransport = createTransport(name)
    const baseShardLogger = shardTransport ? pino(defaultOptions, pino.transport(shardTransport)) : pino(defaultOptions)
    return createEnhancedLogger(baseShardLogger)
}

// Initialize log rotation with master logger after loggers are created
if (shouldStreamToFiles) {
    scheduleLogCleanup(24, logsDir, 7, masterLogger) // Check every 24 hours, clean files older than 7 days
}

module.exports = { databaseLogger, masterLogger, localizerLogger, shardLogger, createEnhancedLogger }