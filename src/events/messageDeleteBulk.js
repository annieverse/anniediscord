
module.exports = (bot, messages) => {
    var metadata = {
        messages: messages,
        typeOfLog: `messageDeleteBulk`,
        bot: bot,
        guild: messages.first().guild
    }

    if (bot.WANT_CUSTOM_LOGS && bot.messageDeleteBulk) new bot.logSystem(metadata).record()
}