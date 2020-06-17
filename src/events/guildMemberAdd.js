const Banner = require(`../ui/prebuild/welcomer`)
const logSystem = require(`../utils/logsSystem`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
const { Attachment } = require(`discord.js`)

module.exports = async (bot, member) => {

    //  Ignore if incoming event was from outer guild (not aau)
    if (member.guild.id != `459891664182312980`) return
    //  Display image
    const renderedBanner = await new Banner(member, bot).build()
    bot.channels.get(`459891664182312982`).send(`
        Welcome to **AAU** ${member} ! Please get your roles in <#538843763544555528> for full access to the server. Last but not least enjoy your stay here! :tada:`,
        new Attachment(renderedBanner, `welcome!-${member.id}.jpg`))

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

    bot.logger.info(`[${member.guild.name}]${bot.users.get(member.id).tag} has joined the server.`)
}
