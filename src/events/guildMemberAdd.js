const Banner = require(`../ui/prebuild/welcomer`)
const { Attachment } = require(`discord.js`)
const { user } = require("../config/permissions")

module.exports = async (bot, member) => {    
    
    await bot.updateConfig(member.guild.id)
    var metadata = {
        member: member,
        guild: member.guild,
		typeOfLog: `guildMemberAdd`,
		bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.guildMemberAdd) new bot.logSystem(metadata).record()
    
    bot.logger.info(`[${member.guild.name}]${bot.users.get(member.id).tag} has joined ${member.guild.name}.`)
    
    // Ignore if welcome module is turned off
    if (!bot.welcome_module) return
    
    if (bot.guild_id != member.guild.id) return bot.logger.info(`[guildMemberAdd.js] Guild id doesnt match, stopping event from continuing`)

    //  Display image
    const renderedBanner = await new Banner(member, bot).build()
    let welcomeChannel = bot.welcome_channel || bot.guilds.get(metadata.guild.id).channels.find(channel => channel.name == `general`).id
    let welcomeText = setUpWelcomeText()
    bot.guilds.get(metadata.guild.id).channels.get(welcomeChannel).send(welcomeText, new Attachment(renderedBanner, `welcome!-${member.id}.jpg`))
    addRoles()
    /*
    bot.channels.get().send(`
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
    */

    function addRoles(){
        let autoRole = bot.welcome_autoRole
        if (autoRole) member.addRole(autoRole)
        let additionalRoles = bot.welcome_roles
        let str = `` + additionalRoles
        additionalRoles = str.split(`, `)
        additionalRoles = removeItemAll(additionalRoles, ``)
        if (additionalRoles.length == 0) return
        for (let index = 0; index < additionalRoles.length; index++) {
            const element = additionalRoles[index];
            member.addRole(element)
        }

        function removeItemAll(arr, value) {
            var i = 0;
            while (i < arr.length) {
              if (arr[i].trim() === value) {
                arr.splice(i, 1);
              } else {
                ++i;
              }
            }
            return arr;
        }
    }

    function setUpWelcomeText(){
        let text = bot.welcome_text
        let metadata = {
            guild: member.guild.name,
            user: member
        }
        text = text.replace(/{{guild}}/gi, metadata.guild)
        text = text.replace(/{{user}}/gi, metadata.user)
        return text
    }

}
