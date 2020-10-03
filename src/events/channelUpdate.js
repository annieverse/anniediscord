module.exports = async (bot, oldChannel, newChannel, configs) => { 
    let metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        guild: oldChannel.guild,
        typeOfLog: `CHANNEL_UPDATE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`)) new bot.logSystem(metadata)
}