module.exports = async (bot, channel) => {
    if (channel.type === `dm`) return
    const configs = bot.fetchGuildConfigs(channel.guild.id)
    let metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `CHANNEL_CREATE`,
        bot: bot,
        configs: configs
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}