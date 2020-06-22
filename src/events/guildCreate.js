const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildCreate`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildCreate) new logSystem(metadata).record()
}