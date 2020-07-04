module.exports = async (bot, channel) => {
    
    await bot.updateConfig(channel.guild.id)

    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelDelete`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.channelDelete) new bot.logSystem(metadata).record()
}