
module.exports = (bot, oldMessage, newMessage, configs) => {
    
    var metadata = {
        oldMessage: oldMessage,
        newMessage: newMessage,
        guild: oldMessage.guild,
        typeOfLog: `messageUpdate`,
        bot: bot
    }

    if (configs.get(`LOG_MODULE`).value && configs.get(`MESSAGE_UPDATE`).value) new bot.logSystem(metadata).record()
}