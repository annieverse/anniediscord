const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildDelete`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildDelete) new logSystem(metadata).record()
}