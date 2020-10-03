module.exports = async (bot, oldEmoji, newEmoji, configs) => {
    let metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        guild: oldEmoji.guild,
        typeOfLog: `EMOJI_UPDATE`,
        bot: bot
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}