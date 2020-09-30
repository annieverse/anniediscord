
module.exports = async (bot, oldGuild, newGuild, configs) => {

    var metadata = {
        oldGuild: oldGuild,
        newGuild: newGuild,
        guild: oldGuild,
        typeOfLog: `guildUpdate`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value && configs.get(`GUILD_UPDATED`).value) new bot.logSystem(metadata).record()
}