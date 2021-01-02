module.exports = (bot, oldMessage, newMessage, configs) => {
	//  Handle if configs is empty
	if (configs === null) return
    let metadata = {
        oldMessage: oldMessage,
        newMessage: newMessage,
        guild: oldMessage.guild,
        typeOfLog: `MESSAGE_UPDATE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}