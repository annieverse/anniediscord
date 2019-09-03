const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});


/**
 *  Setting up configurations for logger
 *  @config
 */
const config = {
    file: {
        level: `info`,
        filename: `logs/info.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
    },
}


/**
 *  Initialize log class
 *  @logger
 */
const logger = createLogger({
    format: combine(
        label({ label: `right meow!` }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File(config.file),
    ],
    exitOnError: false
})



module.exports = logger