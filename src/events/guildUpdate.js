const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, oldGuild, newGuild) => {
    var metadata = {
        oldGuild: oldGuild,
        newGuild: newGuild,
        typeOfLog: `guildUpdate`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildUpdate) new logSystem(metadata).record()
}