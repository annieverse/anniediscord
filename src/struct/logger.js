const winston = require(`winston`)
const { combine, timestamp, printf, colorize } = winston.format
require(`winston-daily-rotate-file`)

/**
 *  By default, logger already initialized in Annie`s Client Object, so you
 *  can call it directly from there.
 * 
 *  REMEMBER TO USE THE CORRECT LOG LEVEL:
 *  
 *  1. `logger.error()` -  Mainly handling unexception or any type of error.
 *  2. `logger.warn()` - Slightly lower priority than .error(). Can be used as precautions.
 *  3. `logger.info()` - General purpose.
 *  4. `logger.verbose()` - Probably you want display more verbose-like/complicated data.
 *  5. `logger.debug()` - Debugging purpose. Mostly used in development.
 *  6. `logger.silly()` - console.log(`yay passed the function.`)
 * 
 * 
 */


 /**
  *  Main format
  */
const customFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`
  })


/**
 *  Production log
 */
if (process.env.NODE_ENV === `production`) winston.add(new winston.transports.DailyRotateFile({    
    filename: `./logs/%DATE%.log`,
    datePattern: `YYYY-MM-DD`,
    maxSize: `20m`,
    maxFiles: `7d`,
    format: combine(
        timestamp(),
        customFormat
    )
}))


/**
 *  Add console logging in development
 */
if (process.env.NODE_ENV === `development`) winston.add(new winston.transports.Console({
    format: combine(
        colorize(),
        timestamp(),
        customFormat
    )
}))


module.exports = winston