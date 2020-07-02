module.exports = async (bot, message) => {

	await bot.updateConfig(message.guild.id)
    
    var metadata = {
        message: message,
        typeOfLog: `messageDelete`,
        bot: bot,
        guild: message.guild
    }
    
    if (bot.WANT_CUSTOM_LOGS && bot.messageDelete) new bot.logSystem(metadata).record()
}