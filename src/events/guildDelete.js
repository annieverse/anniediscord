module.exports = async (bot, guild, configs) => {  
	await bot.guilds.cache.delete(guild.id)  
    let metadata = {
        guild: guild,
        configs: configs,
        typeOfLog: `GUILD_DELETE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}