
module.exports = async (bot, guild) => {

    await bot.db.registerGuild(guild)
    await bot.updateConfig(guild.id)
    
    var metadata = {
        guild: guild,
        typeOfLog: `guildCreate`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildCreate) new bot.logSystem(metadata).record()
}