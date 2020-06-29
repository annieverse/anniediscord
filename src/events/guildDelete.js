
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildDelete`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildDelete) new bot.logSystem(metadata).record()
}