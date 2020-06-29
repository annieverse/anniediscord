
module.exports = (bot, guild, user) => {
    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanRemove`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildBanRemove) new bot.logSystem(metadata).record()
}