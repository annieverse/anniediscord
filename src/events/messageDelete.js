module.exports = async (bot, message) => {
    let metadata = {
        message: message,
        typeOfLog: `MESSAGE_DELETE`,
        bot: bot,
        guild: message.guild
    }
    if (bot.fetchGuildConfigs(message.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}