module.exports = (bot, channel) => {
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelDelete`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.channelDelete) new bot.logSystem(metadata).record()
}