
module.exports = async (bot, guild) => {
    await bot.db.registerGuild(guild)
    var metadata = {
        guild: guild,
        typeOfLog: `guildCreate`,
        bot: bot
    }
    new bot.logSystem(metadata).record()
}