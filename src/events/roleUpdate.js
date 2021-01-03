module.exports = async (bot, oldRole, newRole) => {
    let metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `ROLE_UPDATE`,
        bot: bot,
        guild: oldRole.guild
    }
    if (bot.fetchGuildConfigs(oldRole.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}