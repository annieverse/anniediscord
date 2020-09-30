
module.exports = async (bot, emoji, configs) => {
    
    var metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `emojiDelete`,
        bot: bot
    }

    if (configs.get(`LOGS_MODULE`).value && configs.get(`EMOJI_DELETE`).value) new bot.logSystem(metadata).record()
}