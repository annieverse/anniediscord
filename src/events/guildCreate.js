module.exports = async (bot, guild) => {    
    await bot.db.registerGuild(guild)
    await bot.registerGuildConfigurations()
    await bot.guilds.fetch(guild.id)
    let metadata = {
        guild: guild,
        configs: bot.fetchGuildConfigs(`577121315480272908`),
        typeOfLog: `GUILD_CREATE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}