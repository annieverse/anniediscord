module.exports = async (bot, oldChannel, newChannel) => { 
    let metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        guild: oldChannel.guild,
        typeOfLog: `CHANNEL_UPDATE`,
        bot: bot
    }
    if (bot.fetchGuildConfigs(oldChannel.guild.id).get(`LOGS_MODULE`)) new bot.logSystem(metadata)
}