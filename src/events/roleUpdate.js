module.exports = async (bot, oldRole, newRole, configs) => {
    let metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `ROLE_UPDATE`,
        bot: bot,
        guild: oldRole.guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}