
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildUnavailable`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildUnavailable) new bot.logSystem(metadata).record()
}