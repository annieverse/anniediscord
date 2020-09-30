
module.exports = async (bot, oldRole, newRole, configs) => {

    var metadata = {
        oldRole: oldRole,
        newRole: newRole,
        typeOfLog: `roleUpdate`,
        bot: bot,
        guild: oldRole.guild
    }

    if (configs.get(`LOGS_MODULE`).value && configs.get(`ROLE_UPDATE`).value) new bot.logSystem(metadata).record()
}