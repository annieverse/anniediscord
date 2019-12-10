const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
module.exports = (bot, oldEmoji, newEmoji) => {
    var metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        typeOfLog: `emojiUpdate`,
        bot: bot
    }

    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.emojiUpdate) new logSystem(metadata).record()
}