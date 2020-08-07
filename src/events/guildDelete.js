
module.exports = async (bot, guild) => {    
    var metadata = {
        guild: guild,
        typeOfLog: `guildDelete`,
        bot: bot
    }
    new bot.logSystem(metadata).record()
}