
module.exports = (bot, guild, user) => {
    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanAdd`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildBanAdd) new bot.logSystem(metadata).record()
}