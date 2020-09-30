
module.exports = async (bot, guild, user, configs) => {

    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanRemove`,
        bot: bot
    }
    if (configs.get(`LOG_MODULE`).value && configs.get(`GUILD_BAN_REMOVE`).value) new bot.logSystem(metadata).record()
}