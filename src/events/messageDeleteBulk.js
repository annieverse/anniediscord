const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, messages) => {
    var metadata = {
        messages: messages,
        typeOfLog: `messageDeleteBulk`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.messageDeleteBulk) new logSystem(metadata).record()
}