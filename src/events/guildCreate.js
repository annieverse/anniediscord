
module.exports = (bot, guild) => {
    var metadata = {
        guild: guild,
        typeOfLog: `guildCreate`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildCreate) new bot.logSystem(metadata).record()
}