const Banner = require(`../ui/prebuild/welcomer`)
const { MessageAttachment } = require(`discord.js`)
module.exports = async (bot, member, configs) => {    
    //  Import configs
    let instance = `[Events@guildMemberAdd]`
    let guild = bot.guilds.cache.get(member.guild.id)

    /**
     * Parsing welcomer text's sockets.
     * @param {string} [text=``] target string to be parsed from
     * @returns {string}
     */
    const parseWelcomerText = (text=``) => {
        let res = ``
        res = text.replace(/{{guild}}/gi, guild.name)
        res = text.replace(/{{user}}/gi, member)
        return res
    }
    /**
     *  -------------------------------------------------------
     *  LOG MODULE
     *  -------------------------------------------------------
     */
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata).record()
    /**
     *  -------------------------------------------------------
     *  WELCOMER MODULE
     *  -------------------------------------------------------
     */
    if (configs.get(`WELCOMER_MODULE`).value) {
        //  Prepare welcomer target channel
        let welcomerChannel = configs.get(`WELCOMER_CHANNEL`)
        let getTargetWelcomerChannel = welcomerChannel.value ? welcomerChannel.value : guild.channels.cache.find(channel => channel.name == `general`).id
        //  Prepare welcomer banner img
        let renderedBanner = await new Banner(member, bot).build()
        //  Prepare greeting text
        let welcomerText = configs.get(`WELCOMER_TEXT`)
        let getWelcomerText = parseWelcomerText(welcomerText.value)
        //  Attempt to DM the joined user if guild's owner hasn't setup the welcomer channel yet
        if (!getTargetWelcomerChannel) {
            try {
                member.send(getWelcomerText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
            } catch (error) {
                bot.logger.warn(`${instance} failed to send the requested welcomer message due to there was no welcomer channel and the user's dm were locked.`)
            }
        } else {
            await guild.channels.cache.get(getTargetWelcomerChannel).send(getWelcomerText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
            bot.logger.info(`${instance} successfully sent requested welcomer message for GUILD_ID:${guild.id}`)
        }
    }
    /**
     *  -------------------------------------------------------
     *  WELCOMER'S AUTOROLE MODULE
     *  -------------------------------------------------------
     */
    if (configs.get(`WELCOMER_ROLES_MODULE`).value) {
        //  Skip role assignment if no roles are registered
        const welcomerRolesList = configs.get(`WELCOMER_ROLES_LIST`)
        if (welcomerRolesList.value.length <= 0) return
        for (let i=0; i<welcomerRolesList.value.length; i++) {
            member.roles.add(welcomerAutoRoleList.value[i])
        }
    }
}
