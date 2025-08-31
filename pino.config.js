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
function createTransport() {
    const transports = []

    if (shouldStreamToFiles) {
        // Single file for all logs since we're using child loggers
        const logFilePath = path.join(logsDir, `annie.json`)
        
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
    
    // Special handling for .child() method to return an enhanced child logger
    enhancedLogger.child = function(bindings, options) {
        const childLogger = pinoLogger.child(bindings, options)
        return createEnhancedLogger(childLogger)
    }
    
    // Pass through other pino methods and properties (excluding .child() since we handle it above)
    Object.keys(pinoLogger).forEach(key => {
        if (!enhancedLogger[key] && key !== 'child' && typeof pinoLogger[key] === 'function') {
            enhancedLogger[key] = pinoLogger[key].bind(pinoLogger)
        } else if (!enhancedLogger[key] && key !== 'child') {
            enhancedLogger[key] = pinoLogger[key]
        }
    })
    
    return enhancedLogger
}

// Base logger configuration
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
    name: `ANNIE_BOT`,
    level: logLevel,
    customLevels: levels,
    timestamp: pino.stdTimeFunctions.isoTime
}

// Create base logger with main transport
const mainTransport = createTransport()
const baseLogger = mainTransport ? pino(baseOptions, pino.transport(mainTransport)) : pino(baseOptions)
const rootLogger = createEnhancedLogger(baseLogger)

// Create child loggers using .child() for different modules
const masterLogger = rootLogger.child({ module: `MASTER_SHARD` })
const databaseLogger = rootLogger.child({ module: `DATABASE` })
const localizerLogger = rootLogger.child({ module: `LOCALIZER` })

/**
 * Creates a shard-specific logger using .child()
 * @param {string} name - Shard identifier (e.g., 'SHARD_ID:0', 'SHARD_ID:1/ShardName')
 * @returns {Object} Enhanced child logger for the specific shard
 */
const shardLogger = (name) => {
    return rootLogger.child({ module: name })
}

// Initialize log rotation with root logger after loggers are created
if (shouldStreamToFiles) {
    scheduleLogCleanup(24, logsDir, 7, rootLogger) // Check every 24 hours, clean files older than 7 days
}

module.exports = { databaseLogger, masterLogger, localizerLogger, shardLogger, rootLogger, createEnhancedLogger }