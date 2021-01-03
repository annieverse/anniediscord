module.exports = async (bot, emoji) => {
    let metadata = {
        emoji: emoji,
        guild: emoji.guild,
        typeOfLog: `EMOJI_CREATE`,
        bot: bot
    }
    if (bot.fetchGuildConfigs(emoji.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}