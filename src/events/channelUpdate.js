module.exports = async (bot, oldChannel, newChannel, configs) => {
    
    var metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        guild: oldChannel.guild,
        typeOfLog: `channelUpdate`,
        bot: bot
    }

    if (configs.get(`LOG_MODULE`).value && configs.get(`CHANNEL_UPDATE`).value) new bot.logSystem(metadata).record()
}