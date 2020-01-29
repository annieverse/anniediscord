const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, guild, user) => {
    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanRemove`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildBanRemove) new logSystem(metadata).record()
}