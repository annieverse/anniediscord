const pino = require(`pino`)

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
const isProduction = process.env.NODE_ENV === `development`;


/** 
 * Custom levels
 * Dont use 10, 20, 30, 40, 50, 60
 */
const levels = {
    database: isProduction ? 31 : 29 // Any number between info (30) and warn (40) will work the same
    // database: 31 // Any number between info (30) and warn (40) will work the same
}

const errorTransport = pino.transport({
    targets: [{
        target: 'pino/file',
        options: {
            destination: '~/.pm2/logs/prod-error.log',
        },
        level: 'error'
    }, {
        target: 'pino/file',
        options: {
            destination: '~/.pm2/logs/prod-out.log',
        }
    }],
    levels: levels
})

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
    level: isProduction ? `debug` : `info`, // debug and trace messages will be suppressed
    transport: isProduction ? { target: 'pino-pretty' } : errorTransport, // Use pino-pretty only in development
    customLevels: levels,
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`
}

defaultOptions.name = `MASTER_SHARD`
const masterLogger = pino(defaultOptions)

defaultOptions.name = `DATABASE`
const databaseLogger = pino(defaultOptions)

defaultOptions.name = `LOCALIZER`
const localizerLogger = pino(defaultOptions)

const shardLogger = (name) => {
    defaultOptions.name = name
    return pino(defaultOptions)
}

module.exports = { databaseLogger, masterLogger, localizerLogger, shardLogger }