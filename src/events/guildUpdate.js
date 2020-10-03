module.exports = async (bot, oldGuild, newGuild, configs) => {
    let metadata = {
        oldGuild: oldGuild,
        newGuild: newGuild,
        guild: oldGuild,
        typeOfLog: `guildUpdate`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}