module.exports = (bot, guild) => {    
    bot.db.registerGuild(guild)
    bot.registerSingleGuildConfigurations(guild.id)
}
