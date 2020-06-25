
module.exports = (bot, oldMessage, newMessage) => {
    var metadata = {
        oldMessage: oldMessage,
        newMessage: newMessage,
        guild: oldMessage.guild,
        typeOfLog: `messageUpdate`,
        bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.messageUpdate) new bot.logSystem(metadata).record()
}