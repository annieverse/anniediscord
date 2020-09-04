const Banner = require(`../ui/prebuild/welcomer`)
const { MessageAttachment } = require(`discord.js`)

module.exports = async (bot, member) => {    
    
    await bot.updateConfig(member.guild.id)
    var metadata = {
        member: member,
        guild: member.guild,
		typeOfLog: `guildMemberAdd`,
		bot: bot
    }

    if (bot.WANT_CUSTOM_LOGS && bot.guildMemberAdd) new bot.logSystem(metadata).record()
    
    bot.logger.info(`[${member.guild.name}]${bot.users.cache.get(member.id).tag} has joined ${member.guild.name}.`)
    
    // Ignore if welcome module is turned off
    if (!parseInt(bot.welcome_module)) return
    
    if (bot.guild_id != member.guild.id) return bot.logger.info(`[guildMemberAdd.js] Guild id doesnt match, stopping event from continuing`)

    //  Display image
    const renderedBanner = await new Banner(member, bot).build()
    let welcomeChannel = bot.welcome_channel || bot.guilds.cache.get(metadata.guild.id).channels.cache.find(channel => channel.name == `general`).id
    let welcomeText = setUpWelcomeText()
    if (!welcomeChannel) {
        try {
            member.send(welcomeText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
        } catch (error) {
            bot.logger.info(`[guildMemberAdd.js] There was no welcome channel and the user's dm were locked.`)
        }
    } else {
        bot.guilds.cache.get(metadata.guild.id).channels.cache.get(welcomeChannel).send(welcomeText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
    }
    
    addRoles()

    function addRoles(){
        let autoRole = bot.welcome_autoRole
        if (autoRole) member.roles.add(autoRole)
        let additionalRoles = bot.welcome_roles
        let str = `` + additionalRoles
        additionalRoles = str.split(`, `)
        additionalRoles = removeItemAll(additionalRoles, ``)
        if (additionalRoles.length == 0) return
        for (let index = 0; index < additionalRoles.length; index++) {
            const element = additionalRoles[index]
            member.roles.add(element)
        }

        function removeItemAll(arr, value) {
            var i = 0
            while (i < arr.length) {
              if (arr[i].trim() === value) {
                arr.splice(i, 1)
              } else {
                ++i
              }
            }
            return arr
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
