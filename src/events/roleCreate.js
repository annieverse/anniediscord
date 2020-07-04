
module.exports = async (bot, role) => {

	await bot.updateConfig(role.guild.id)
    
    var metadata = {
        role: role,
        typeOfLog: `roleCreate`,
        bot: bot,
        guild: role.guild
    }
    
    if (bot.WANT_CUSTOM_LOGS && bot.roleCreate) new bot.logSystem(metadata).record()
}