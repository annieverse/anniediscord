
module.exports = async (bot, emoji) => {
    
    await bot.updateConfig(emoji.guild.id)

    var metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `emojiDelete`,
        bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.emojiDelete) new bot.logSystem(metadata).record()
}