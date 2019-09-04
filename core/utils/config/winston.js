const env = require(`../../../.data/environment`)
const { createLogger, format, transports } = require(`winston`)
const winstonDailyRotateFile = require(`winston-daily-rotate-file`)
const { combine, printf } = format


/**
 *  By default, logger already initialized in Annie's Client Object, so you
 *  can call it directly from there.
 * 
 *  REMEMBER TO USE THE CORRECT LOG LEVEL:
 *  
 *  1. `logger.error()` -  Mainly handling unexception or any type of error.
 *  2. `logger.warn()` - Slightly lower priority than .error(). Can be used as precautions.
 *  3. `logger.info()` - General purpose.
 *  4. `logger.verbose()` - Probably you want display more verbose-like/complicated data.
 *  5. `logger.debug()` - Debugging purpose. Mostly used in development.
 *  6. `logger.silly()` - console.log('yay passed the function.')
 */


/**
 *  Define the display format for log files
 *  @fileFormat
 */
const fileFormat = combine(
    format.timestamp(),
    format.align(),
    printf(data => `${data.timestamp} [${data.level}]: ${data.message}`)
)


/**
 *  Define the display format for console
 *  @consoleFormat
 */
const consoleFormat = combine(
    format.prettyPrint(),
    format.colorize(),
    format.timestamp(),
    format.align(),
    printf(data => `${data.timestamp} [${data.level}]: ${data.message}`)
)


/**
 *  Register transport
 *  @loggersAdd
 */
const loggers = createLogger({
    exitOnError: false,
    transports: [
        
        /**
         *  This will store the log based on current date
         */
        new winstonDailyRotateFile({
            filename: `./logs/records-%DATE%.log`,
            datePattern: `YYYY-MM-DD`,
            level: `info`,
            format: fileFormat
        }),

        /**
         *  Also Add console logging if currently in dev environment
         */
        env.dev ? new transports.Console({
            level: `info`,
            format: consoleFormat
        }) : null

    ],
})


module.exports = loggers