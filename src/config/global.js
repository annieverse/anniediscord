let config = {}

/**
 *  -----------------------------------------------------------
 *  This defines the current version of the app.
 *  @STRING
 */
config.VERSION = require(`../../package`).version

/**
 *  -----------------------------------------------------------
 *  This defines the current environment that the app hosted on.
 *  Set NODE_ENV to development if you are hosting this locally.
 *  @BOOLEAN
 */
config.DEV = process.env.NODE_ENV === `development`

/**
 *  -----------------------------------------------------------
 *  This defines the connection port that Annie will be using.
 *  If not defined, it will use 3000 as the default port.
 *  @NUMBER
 */
config.PORT = process.env.PORT || 3000

/**
 *  -----------------------------------------------------------
 *  This is the command prefix that Annie will be using.
 *  If not defined, it will use `>` as the default prefix.
 *  @STRING
 */
config.PREFIX = process.env.PREFIX || `>`

/**
 *  -----------------------------------------------------------
 *  Plugins are used to control Annie's Workflow such as disabling exp, setting custom cooldown state, etc
 *  The available plugins are:
 *      1.) ACTIVE_EXP - enables EXP gaining.
 *      2.) ACTIVE_ARTCOINS - enables ARTCOINS gaining.
 *      3.) DISABLE_COOLDOWN - disables EXP/COMMAND cooldown state.
 *      4.) WELCOMER_TEXT - automatically trigger welcomer image on a specific channel (experimental).
 * 
 *  @ARRAY type for the container
 *  @STRING type for the supplied parameter
 */
config.PLUGINS = [`ACTIVE_EXP`, `ACTIVE_ARTCOINS`]


config.PERMISSIONS = require(`./permissions`)
config.EXP = require(`./exp`)
config.CURRENCY = require(`./currency`)


module.exports = config