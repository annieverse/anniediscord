const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, members, guild) => {
    var metadata = {
        guild: guild,
        members: members,
        typeOfLog: `guildMembersChunk`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildMembersChunk) new logSystem(metadata).record()
}