const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, channel) => {
    var metadata = {
        channel: channel,
        typeOfLog: `channelCreate`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.channelCreate) new logSystem(metadata).record()
}