
module.exports = async (bot, role, configs) => {

    var metadata = {
        role: role,
        typeOfLog: `roleDelete`,
        bot: bot,
        guild: role.guild
    }

    if (configs.get(`LOG_MODULE`).value && configs.get(`ROLE_DELETE`).value) new bot.logSystem(metadata).record()
}