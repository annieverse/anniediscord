module.exports = async (bot, channel, configs) => {
    let metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `CHANNEL_DELETE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}