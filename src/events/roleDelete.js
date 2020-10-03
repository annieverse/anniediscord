module.exports = async (bot, role, configs) => {
    let metadata = {
        role: role,
        typeOfLog: `ROLE_DELETE`,
        bot: bot,
        guild: role.guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}