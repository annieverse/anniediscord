module.exports = async (bot, channel, configs) => {
    
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelDelete`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value && configs.get(`CHANNEL_DELETE`).value) new bot.logSystem(metadata).record()
}