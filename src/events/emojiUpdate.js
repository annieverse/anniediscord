
module.exports = async (bot, oldEmoji, newEmoji) => {

    await bot.updateConfig(oldEmoji.guild.id)

    var metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        guild: oldEmoji.guild,
        typeOfLog: `emojiUpdate`,
        bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.emojiUpdate) new bot.logSystem(metadata).record()
}