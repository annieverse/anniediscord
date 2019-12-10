const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, oldRole, newRole) => {
    var metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `roleUpdate`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.roleUpdate) new logSystem(metadata).record()
}