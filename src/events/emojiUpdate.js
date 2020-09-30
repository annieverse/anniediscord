
module.exports = async (bot, oldEmoji, newEmoji, configs) => {

    var metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        guild: oldEmoji.guild,
        typeOfLog: `emojiUpdate`,
        bot: bot
    }

    if (configs.get(`LOGS_MODULE`).value && configs.get(`EMOJI_UPDATE`).value) new bot.logSystem(metadata).record()
}