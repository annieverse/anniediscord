module.exports = async (bot, messages, configs) => {
    let metadata = {
        messages: messages,
        typeOfLog: `MESSAGE_DELETE_BULK`,
        bot: bot,
        guild: messages.first().guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}