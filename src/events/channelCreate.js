module.exports = async (bot, channel, configs) => {
    
    if (channel.type == `dm`) return
        
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelCreate`,
        bot: bot,
        configs: configs
    }
    
    if (configs.get(`LOG_MODULE`).value && configs.get(`CHANNEL_CREATE`).value) new bot.logSystem(metadata).record()
}