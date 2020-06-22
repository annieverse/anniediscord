const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, message) => {
    var metadata = {
        message: message,
        typeOfLog: `messageDelete`,
        bot: bot
    }
    
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.messageDelete) new logSystem(metadata).record()
}