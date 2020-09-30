
module.exports = async (bot, guild, user, configs) => {

    var metadata = {
        guild: guild,
        user: user,
        typeOfLog: `guildBanAdd`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value && configs.get(`GUILD_BAN_ADD`).value) new bot.logSystem(metadata).record()
}