const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../config/logsSystemModules.json`)
module.exports = (bot, oldChannel, newChannel) => {
    var metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        typeOfLog: `channelUpdate`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.channelUpdate) new logSystem(metadata).record()
}