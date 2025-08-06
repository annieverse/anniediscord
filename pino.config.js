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
const isDevelopment = process.env.NODE_ENV === `development`;
const isProduction = process.env.NODE_ENV === `production` || process.env.NODE_ENV === `production_beta`;

/**
 * Create production file destination with rotation
 * Logs will be stored in ./logs/ with 7-day rotation
 */
function createProductionDestination(loggerName) {
    if (!isProduction) {
        return undefined; // Use default stdout for development
    }

    const transport = pino.transport({
        target: 'pino-roll',
        options: {
            file: `./logs/${loggerName.toLowerCase()}.log`,
            frequency: 'daily',
            size: '10m', 
            mkdir: true,
            limit: {
                count: 6 // Keep 6 old files + current = 7 days total
            },
            dateFormat: 'yyyy-MM-dd',
            symlink: true // Create current.log symlink for easier access
        }
    });
    
    return transport;
}


/** 
 * Custom levels
 * Dont use 10, 20, 30, 40, 50, 60
 */
const levels = {
    database: isDevelopment ? 31 : 29 // Any number between info (30) and warn (40) will work the same
    // database: 31 // Any number between info (30) and warn (40) will work the same
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
    level: isDevelopment ? `debug` : `info`, // debug and trace messages will be suppressed
    customLevels: levels,
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`
}

// Create loggers with appropriate destinations
function createLogger(name) {
    const options = { ...defaultOptions, name };
    const destination = createProductionDestination(name);
    
    if (destination) {
        return pino(options, destination);
    }
    return pino(options);
}

const masterLogger = createLogger(`MASTER_SHARD`);
const databaseLogger = createLogger(`DATABASE`);
const localizerLogger = createLogger(`LOCALIZER`);

const shardLogger = (name) => {
    return createLogger(name);
}

module.exports = { databaseLogger, masterLogger, localizerLogger, shardLogger }