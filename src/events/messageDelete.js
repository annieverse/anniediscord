module.exports = async (bot, message, configs) => {

    var metadata = {
        message: message,
        typeOfLog: `messageDelete`,
        bot: bot,
        guild: message.guild
    }
    
    if (configs.get(`LOGS_MODULE`).value && configs.get(`MESSAGE_DELETE`).value) new bot.logSystem(metadata).record()
}