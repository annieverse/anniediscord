const Banner = require(`../ui/prebuild/welcomer`)
module.exports = async function guildMemberAdd(client, member) {   
    //  Import configs
    let instance = `[EVENTS@GUILD_MEMBER_ADD]`
    let guild = member.guild
    let configs = guild.configs
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
    const logs = configs.get(`LOGS_MODULE`).value 
    if (logs) {
        const logChannel = client.getGuildLogChannel(member.guild.id)
        if (logChannel) {
            //  Perform logging to target guild
            client.responseLibs(logChannel, true)
            .send(`Everyone, let's welcome our new member; ${member}!♡ Sit tight and enjoy my well-made milk tea~`, {
                header: `Welcome, cutie!♡`,
                thumbnail: member.user.displayAvatarURL(),
                timestampAsFooter: true
            }) 
           .catch(e => e)
        }
    } 
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
        let renderedBanner = await new Banner(member, client).build()
        //  Prepare greeting text
        let welcomerText = configs.get(`WELCOMER_TEXT`)
        let getWelcomerText = parseWelcomerText(welcomerText.value)
        //  Attempt to DM the joined user if guild's owner hasn't setup the welcomer channel yet
        if (getTargetWelcomerChannel) {
                client.responseLibs(member, true)
                .send(`__**A letter from ${guild.name}.**__\n` + getWelcomerText, {
                    simplified: true,
                    prebuffer: true,
                    image: renderedBanner
                })
                .catch(()=> client.logger.warn(`${instance} failed to send the requested welcomer message due to there was no welcomer channel and the user's dm were locked.`))
        } else {
            //  Handle if target channel is invalid or cannot be found
            if (!guild.channels.cache.has(getTargetWelcomerChannel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`) 
            const ch = guild.channels.cache.get(getTargetWelcomerChannel)
            client.responseLibs(ch, true) 
            .send(getWelcomerText, {
                simplified: true,
                prebuffer: true,
                image: renderedBanner
            })
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
            if (!guild.roles.cache.has(roleId)) continue
            member.roles.add(roleId)
            successfulRoleAdded++
        }
    }
}
