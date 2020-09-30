
module.exports = async (bot, guild, user, configs) => {

    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanAdd`,
        bot: bot
    }
    if (configs.get(`LOG_MODULE`).value && configs.get(`GUILD_BAN_ADD`).value) new bot.logSystem(metadata).record()
}