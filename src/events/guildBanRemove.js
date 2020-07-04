
module.exports = async (bot, guild, user) => {

    await bot.updateConfig(guild.id)

    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanRemove`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.guildBanRemove) new bot.logSystem(metadata).record()
}