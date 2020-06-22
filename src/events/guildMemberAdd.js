const Banner = require(`../ui/prebuild/welcomer`)
const { Attachment } = require(`discord.js`)
const logSystem = require(`../libs/logs.js`)
const logSystemConfig = require(`../config/logsSystemModules.json`)

module.exports = async (bot, member) => {

    //  Ignore if incoming event was from outer guild (not aau)
    if (member.guild.id != `459891664182312980`) return
    //  Display image
    const renderedBanner = await new Banner(member, bot).build()
    bot.channels.get(`459891664182312982`).send(`
        Welcome to **AAU** ${member} ! Please get your roles in <#538843763544555528> for full access to the server. Last but not least enjoy your stay here! :tada:`,
        new Attachment(renderedBanner, `welcome!-${member.id}.jpg`))

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

    var metadata = {
		member: member,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (logSystemConfig.WANT_CUSTOM_LOGS && logSystemConfig.guildMemberRemove) new logSystem(metadata).record()
}
