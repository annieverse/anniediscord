
module.exports = async (bot, oldRole, newRole) => {

	await bot.updateConfig(oldRole.guild.id)
    
    var metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `roleUpdate`,
        bot: bot,
        guild: oldRole.guild
    }

    if (bot.WANT_CUSTOM_LOGS && bot.roleUpdate) new bot.logSystem(metadata).record()
}