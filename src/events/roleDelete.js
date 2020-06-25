
module.exports = (bot, role) => {
    var metadata = {
        role: role,
        typeOfLog: `roleDelete`,
        bot: bot,
        guild: role.guild
    }

    if (bot.WANT_CUSTOM_LOGS && bot.roleDelete) new bot.logSystem(metadata).record()
}