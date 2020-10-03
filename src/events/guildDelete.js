module.exports = async (bot, guild) => {    
    let metadata = {
        guild: guild,
        typeOfLog: `GUILD_DELETE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}