module.exports = async (bot, guild) => {    
    bot.db.registerGuild(guild)
    //  The reason why we check for guild configurations on database
    //  for a guild that just joined is to ensure that they able to use
    //  their previously saved configurations. This case applies when a guild or server
    //  has previously owned annie on their server with custom configurations..
    bot.registerSingleGuildConfigurations(guild.id, await bot.db.getGuildConfigurations(guild.id))
}
