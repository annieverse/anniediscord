const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, role) => {
    var metadata = {
        role: role,
        typeOfLog: `roleCreate`,
        bot: bot
    }
    
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.roleCreate) new logSystem(metadata).record()
}