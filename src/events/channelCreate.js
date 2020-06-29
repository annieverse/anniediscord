module.exports = (bot, channel) => {
    var metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `channelCreate`,
        bot: bot
    }
    if (bot.WANT_CUSTOM_LOGS && bot.channelCreate) new bot.logSystem(metadata).record()
}