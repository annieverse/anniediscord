const winston = require(`winston`)

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
 * 
 * 
 *  Fallback version*
 */



module.exports = winston