module.exports = (bot, emoji) => {
    var metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `emojiCreate`,
        bot: bot
    }
    
    if (bot.WANT_CUSTOM_LOGS && bot.emojiCreate) new bot.logSystem(metadata).record()
}