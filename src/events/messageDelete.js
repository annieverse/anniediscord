module.exports = async (bot, message, configs) => {
    let metadata = {
        message: message,
        typeOfLog: `MESSAGE_DELETE`,
        bot: bot,
        guild: message.guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}