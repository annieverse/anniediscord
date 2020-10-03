module.exports = async (bot, guild, user, configs) => {
    let metadata = {
        guild: guild,
        user: user,
        typeOfLog: `GUILD_BAN_REMOVE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}