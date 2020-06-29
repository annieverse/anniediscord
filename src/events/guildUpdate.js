
module.exports = (bot, oldGuild, newGuild) => {
    var metadata = {
        oldGuild: oldGuild,
        newGuild: newGuild,
        guild: oldGuild,
        typeOfLog: `guildUpdate`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildUpdate) new bot.logSystem(metadata).record()
}