const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, guild, user) => {
    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanAdd`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildBanAdd) new logSystem(metadata).record()
}