module.exports = async (bot, guild) => {    
    await bot.db.registerGuild(guild)
    let metadata = {
        guild: guild,
        typeOfLog: `GUILD_CREATE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}