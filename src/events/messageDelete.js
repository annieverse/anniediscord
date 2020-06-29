module.exports = (bot, message) => {
    var metadata = {
        message: message,
        typeOfLog: `messageDelete`,
        bot: bot,
        guild: message.guild
    }
    
    if (bot.WANT_CUSTOM_LOGS && bot.messageDelete) new bot.logSystem(metadata).record()
}