
module.exports = (bot, oldEmoji, newEmoji) => {
    var metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        guild: oldEmoji.guild,
        typeOfLog: `emojiUpdate`,
        bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.emojiUpdate) new bot.logSystem(metadata).record()
}