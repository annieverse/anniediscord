module.exports = async (bot, channel, configs) => {
    if (channel.type == `dm`) return
    let metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `CHANNEL_CREATE`,
        bot: bot,
        configs: configs
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}