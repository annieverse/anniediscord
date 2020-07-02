
module.exports = async (bot, guild) => {
    
    await bot.updateConfig(guild.id)
    
    var metadata = {
        guild: guild,
        typeOfLog: `guildDelete`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildDelete) new bot.logSystem(metadata).record()
}