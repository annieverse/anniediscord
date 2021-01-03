module.exports = async (bot, role) => {
    let metadata = {
        role: role,
        typeOfLog: `ROLE_CREATE`,
        bot: bot,
        guild: role.guild
    }
    if (bot.fetchGuildConfigs(role.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}