const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../config/logsSystemModules.json`)
module.exports = (bot, channel) => {
    var metadata = {
        channel: channel,
        typeOfLog: `channelDelete`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.channelDelete) new logSystem(metadata).record()
}