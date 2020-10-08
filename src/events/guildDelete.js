module.exports = async (bot, guild, configs) => {    
    let metadata = {
        guild: guild,
        configs: configs,
        typeOfLog: `GUILD_DELETE`,
        bot: bot
    }
    new bot.logSystem(metadata)
}