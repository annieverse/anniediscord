const winston = require(`winston`)
const moment = require(`moment`)
const { combine, timestamp, printf, colorize, splat } = winston.format
require(`winston-daily-rotate-file`)

/**
 *  By default, logger already initialized as Annie`s Client property, so it's preferred
 *  way to call it directly from there.
 * 
 *  Below are the available log option:
 *  
 *  1. `logger.error()` -  Mainly displaying majority of error log.
 *  2. `logger.warn()` - Slightly lower priority than .error(). Can be used as precautions.
 *  3. `logger.info()` - General purpose.
 *  4. `logger.verbose()` - Probably you want display more verbose information.
 *  5. `logger.debug()` - Debugging purpose. Mostly used in development.
 *  6. `logger.silly()` - console.log(`yay passed the function.`)
 */
const logFormat = printf(info => {
    const parsedMessage = info.message === `object` ? JSON.stringify(info.message).toString() : info.message
    return `${moment(info.timestamp).format(`DD-MM-Y hh:mm:ss`)} [${info.level}]: ${parsedMessage}`
  })


//  Production Logging
if (process.env.NODE_ENV === `production`) {
    winston.add(new winston.transports.DailyRotateFile({ 
        level: `info`,  
        filename: `./logs/%DATE%.log`,
        datePattern: `YYYY-MM-DD`,
        maxSize: `20m`,
        maxFiles: `7d`,
        format: combine(
            timestamp(),
            logFormat
        )
    }))
}


//  Development Logging
if (process.env.NODE_ENV === `development`) {
    winston.add(new winston.transports.Console({
        level: `debug`,
        format: combine(
            winston.format(info => {
                info.level = info.level.toUpperCase()
                return info
            })(),
            splat(),
            colorize(),
            timestamp(),
            logFormat
        )
    }))
}

module.exports = winston