module.exports = (bot, oldMessage, newMessage, configs) => {
    let metadata = {
        oldMessage: oldMessage,
        newMessage: newMessage,
        guild: oldMessage.guild,
        typeOfLog: `MESSAGE_UPDATE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}