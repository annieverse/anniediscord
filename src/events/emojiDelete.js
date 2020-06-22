const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, emoji) => {
    var metadata = {
        emoji: emoji,
        typeOfLog: `emojiDelete`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.emojiDelete) new logSystem(metadata).record()
}