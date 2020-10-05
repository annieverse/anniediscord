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
        text = text.replace(/{{guild}}/gi, `**${guild.name}**`)
        text = text.replace(/{{user}}/gi, member)
        return text
    }
    /**
     *  -------------------------------------------------------
     *  LOG MODULE
     *  -------------------------------------------------------
     */
    //  Logging metadata
    let metadata = {
        typeOfLog: `GUILD_MEMBER_ADD`,
        bot: bot,
        member: member,
        guild: guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
    /**
     *  -------------------------------------------------------
     *  WELCOMER MODULE
     *  -------------------------------------------------------
     */
    if (configs.get(`WELCOMER_MODULE`).value) {
        //  Prepare welcomer target channel
        let welcomerChannel = configs.get(`WELCOMER_CHANNEL`)
        let getTargetWelcomerChannel = welcomerChannel.value
        //  Prepare welcomer banner img
        let renderedBanner = await new Banner(member, bot).build()
        //  Prepare greeting text
        let welcomerText = configs.get(`WELCOMER_TEXT`)
        let getWelcomerText = parseWelcomerText(welcomerText.value)
        //  Attempt to DM the joined user if guild's owner hasn't setup the welcomer channel yet
        if (!getTargetWelcomerChannel) {
                member.send(`__**A letter from ${guild.name}.**__\n` + getWelcomerText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
                .then(() => bot.logger.info(`${instance} succesfully sent requested welcomer message to new member's DM due to unprovided guild's target welcomer channel.`))
                .catch(()=> bot.logger.warn(`${instance} failed to send the requested welcomer message due to there was no welcomer channel and the user's dm were locked.`))
        } else {
            //  Handle if target channel is invalid or cannot be found
            if (!guild.channels.cache.has(getTargetWelcomerChannel)) {
                return bot.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`) 
            }
            await guild.channels.cache.get(getTargetWelcomerChannel).send(getWelcomerText, new MessageAttachment(renderedBanner, `welcome!-${member.id}.jpg`))
            bot.logger.info(`${instance} successfully sent requested welcomer message for GUILD_ID:${guild.id}`)
        }
    }
    /**
     *  -------------------------------------------------------
     *  WELCOMER'S AUTOROLE MODULE
     *  -------------------------------------------------------
     */
    //  Skip role assignment if no roles are registered
    const welcomerRolesList = configs.get(`WELCOMER_ROLES`)
    if (welcomerRolesList.value.length <= 0) return
    let successfulRoleAdded = 0
    for (let i=0; i<welcomerRolesList.value.length; i++) {
        const roleId = welcomerRolesList.value[i]
        //  Handle if role cannot be found due to deleted/invalid
        if (!guild.roles.cache.has(roleId)) {
            bot.logger.warn(`${instance} failed to find welcomer's role for GUILD_ID:${guild.id} due to deleted or invalid ID.`)
            continue
        }
        member.roles.add(roleId)
        successfulRoleAdded++
    }
    if (successfulRoleAdded > 0) bot.logger.info(`${instance} successfully assigned ${successfulRoleAdded} WELCOME_ROLES for GUILD_ID:${guild.id}`)   
}
