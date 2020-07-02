module.exports = async (bot, oldChannel, newChannel) => {
    
    await bot.updateConfig(oldChannel.guild.id)

    var metadata = {
        oldChannel: oldChannel,
        newChannel : newChannel,
        guild: oldChannel.guild,
        typeOfLog: `channelUpdate`,
        bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.channelUpdate) new bot.logSystem(metadata).record()
}