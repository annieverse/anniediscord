module.exports = async (bot, emoji, configs) => {

    var metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `emojiCreate`,
        bot: bot
    }
    
    if (configs.get(`LOGS_MODULE`).value && configs.get(`EMOJI_CREATE`).value) new bot.logSystem(metadata).record()
}