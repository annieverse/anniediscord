module.exports = async (bot, guild) => {
    let metadata = {
        guild: guild,
        typeOfLog: `GUILD_UNAVAILABLE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}