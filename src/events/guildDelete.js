module.exports = async (bot, guild) => {  
	await bot.guilds.cache.delete(guild.id)  
    let metadata = {
        guild: guild,
        configs: bot.fetchGuildConfigs(`577121315480272908`),
        typeOfLog: `GUILD_DELETE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}