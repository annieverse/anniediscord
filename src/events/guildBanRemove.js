module.exports = async (bot, guild, user) => {
    let metadata = {
        guild: guild,
        user: user,
        typeOfLog: `GUILD_BAN_REMOVE`,
        bot: bot
    }
    if (bot.fetchGuildConfigs(guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}