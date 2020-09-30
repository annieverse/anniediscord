module.exports = async (bot, channel, configs) => {
    
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelDelete`,
        bot: bot
    }
    if (configs.get(`LOG_MODULE`).value && configs.get(`CHANNEL_DELETE`).value) new bot.logSystem(metadata).record()
}