
module.exports = async (bot, role) => {

	await bot.updateConfig(role.guild.id)
    
    var metadata = {
        role: role,
        typeOfLog: `roleDelete`,
        bot: bot,
        guild: role.guild
    }

    if (bot.WANT_CUSTOM_LOGS && bot.roleDelete) new bot.logSystem(metadata).record()
}