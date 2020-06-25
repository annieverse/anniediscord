
module.exports = (bot, oldRole, newRole) => {
    var metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `roleUpdate`,
        bot: bot,
        guild: oldRole.guild
    }

    if (bot.WANT_CUSTOM_LOGS && bot.roleUpdate) new bot.logSystem(metadata).record()
}