
module.exports = async (bot, guild) => {
       
    var metadata = {
        guild: guild,
        typeOfLog: `guildUnavailable`,
        bot: bot
    }
    new bot.logSystem(metadata).record()
}