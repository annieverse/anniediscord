
module.exports = async (bot, messages, configs) => {
    
    var metadata = {
        messages: messages,
        typeOfLog: `messageDeleteBulk`,
        bot: bot,
        guild: messages.first().guild
    }

    if (configs.get(`LOGS_MODULE`).value && configs.get(`MESSAGE_DELETE_BULK`).value) new bot.logSystem(metadata).record()
}