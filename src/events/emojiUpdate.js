module.exports = async (bot, oldEmoji, newEmoji) => {
    let metadata = {
        oldEmoji: oldEmoji,
        newEmoji: newEmoji,
        guild: oldEmoji.guild,
        typeOfLog: `EMOJI_UPDATE`,
        bot: bot
    }
    if (bot.fetchGuildConfigs(oldEmoji.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}