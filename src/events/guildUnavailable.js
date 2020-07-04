
module.exports = async (bot, guild) => {
    
    await bot.updateConfig(guild.id)
    
    var metadata = {
        guild: guild,
        typeOfLog: `guildUnavailable`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildUnavailable) new bot.logSystem(metadata).record()
}