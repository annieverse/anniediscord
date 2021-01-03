module.exports = async (bot, channel) => {
    let metadata = {
        channel: channel,
        guild: channel.guild,
        typeOfLog: `CHANNEL_DELETE`,
        bot: bot
    }
    if (bot.fetchGuildConfigs(channel.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}