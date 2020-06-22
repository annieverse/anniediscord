const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildUnavailable`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildUnavailable) new logSystem(metadata).record()
}