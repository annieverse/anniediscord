
module.exports = async (bot, role, configs) => {

    var metadata = {
        role: role,
        typeOfLog: `roleCreate`,
        bot: bot,
        guild: role.guild
    }
    
    if (configs.get(`LOG_MODULE`).value && configs.get(`ROLE_CREATE`).value) new bot.logSystem(metadata).record()
}