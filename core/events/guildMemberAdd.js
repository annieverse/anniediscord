const Banner = require(`../utils/welcomeBannerUI`)
const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)

module.exports = async (bot, member) => {
    const banner = new Banner({bot:bot, member:member, channel:`459891664182312982`})

    //  Display image
    banner.render()
    
    //	Register new data if its a new user, else ignore.
    await bot.db.validatingNewUser(member.user.id)
    // Add Pencilician role
    member.addRole(`460826503819558914`)
    // Add unverified role 
    member.addRole(`588663266805415936`)
    // Add Artists role divider
    member.addRole(`615549512303247360`)
    // Add Unique role divider
    member.addRole(`615557744644063281`)
    // Add Ping role divider
    member.addRole(`632892126824235009`)

    bot.logger.info(`${bot.users.get(member.id).tag} has joined the server.`)
    var metadata = {
        member: member,
        typeOfLog: `guildMemberAdd`,
        bot: bot
    }
    if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildMemberAdd) new logSystem(metadata).record()
}
