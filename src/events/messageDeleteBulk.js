module.exports = async (bot, messages) => {
    let metadata = {
        messages: messages,
        typeOfLog: `MESSAGE_DELETE_BULK`,
        bot: bot,
        guild: messages.first().guild
    }
    if (bot.fetchGuildConfigs(messages.first().guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}