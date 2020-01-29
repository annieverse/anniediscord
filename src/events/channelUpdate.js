const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, oldChannel, newChannel) => {
    var metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        typeOfLog: `channelUpdate`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.channelUpdate) new logSystem(metadata).record()
}