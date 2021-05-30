module.exports = (bot, guild) => {    
    bot.db.registerGuild(guild)
    bot.registerGuildConfigurations(guild.id)
}
