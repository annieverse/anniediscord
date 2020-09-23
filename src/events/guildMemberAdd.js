const Banner = require(`../ui/prebuild/welcomer`)
const { MessageAttachment } = require(`discord.js`)

module.exports = async (bot, member, configs) => {    
    
    var metadata = {
        member: member,
        guild: member.guild,
		typeOfLog: `guildMemberAdd`,
		bot: bot
    }

    if (configs.get(`LOG_MODULE`).value && configs.get(`GUILD_MEMBER_ADD`).value) new bot.logSystem(metadata).record()
    
    bot.logger.info(`[${member.guild.name}]${bot.users.cache.get(member.id).tag} has joined ${member.guild.name}.`)
    
    // Ignore if welcome module is turned off
    if (!configs.get(`WELCOMER_MODULE`).value) return
    
    if (metadata.guild.id != member.guild.id) return bot.logger.info(`[guildMemberAdd.js] Guild id doesnt match, stopping event from continuing`)

    //  Display image
    const renderedBanner = await new Banner(member, bot).build()
    let welcomeChannel = configs.get(`WELCOMER_CHANNEL`).value || bot.guilds.cache.get(metadata.guild.id).channels.cache.find(channel => channel.name == `general`).id
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
        if (!configs.get(`WELCOMER_ROLE_AUTOASSIGN`).value) return
        let additionalRoles = configs.get(`WELCOMER_ROLES`).value 
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
        let text = configs.get(`WELCOMER_TEXT`).value
        if (text.length < 1) text = `Welcome {{user}}!`
        let metadata = {
            guild: member.guild.name,
            user: member
        }
        text = text.replace(/{{guild}}/gi, metadata.guild)
        text = text.replace(/{{user}}/gi, metadata.user)
        return text
    }

}
