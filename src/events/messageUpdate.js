const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, oldMessage, newMessage) => {
    var metadata = {
        oldMessage: oldMessage,
        newMessage: newMessage,
        typeOfLog: `messageUpdate`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.messageUpdate) new logSystem(metadata).record()
}