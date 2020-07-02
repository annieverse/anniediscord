module.exports = async (bot, channel) => {
    
    await bot.updateConfig(channel.guild.id)
    
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelCreate`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.channelCreate) new bot.logSystem(metadata).record()
}