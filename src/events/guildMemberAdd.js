const Banner = require(`../ui/prebuild/welcomer`)
const { parseWelcomerText } = require(`../utils/welcomerFunctions.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const levelZeroErrors = require(`../utils/errorLevels.js`)
const {ChannelType} = require(`discord.js`)

module.exports = async function guildMemberAdd(client, member) {
    if (member.partial) return
    await member.fetch()
    if (!member.guild.configs) return
    //  Import configs
    let instance = `[EVENTS@GUILD_MEMBER_ADD]`
    let guild = member.guild
    let configs = guild.configs

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
        if ((await member.guild.fetchOnboarding()).enabled && configs.get(`WELCOMER_ONBOARDWAIT`).value) return
        //  Prepare welcomer target channel
        let welcomerChannel = configs.get(`WELCOMER_CHANNEL`)
        let getTargetWelcomerChannel = welcomerChannel.value
        //  Prepare welcomer banner img
        let renderedBanner = await new Banner(member, client).build()
        //  Prepare greeting text
        let welcomerText = configs.get(`WELCOMER_TEXT`)
        let getWelcomerText = parseWelcomerText(welcomerText.value, guild, member)
        //  Attempt to DM the joined user if guild's owner hasn't setup the welcomer channel yet
        if (!getTargetWelcomerChannel) {
            client.responseLibs(member, true)
                .send(`__**A letter from ${guild.name}.**__\n` + getWelcomerText, {
                    simplified: true,
                    prebuffer: true,
                    image: renderedBanner
                })
                .catch(() => client.logger.warn(`${instance} failed to send the requested welcomer message due to there was no welcomer channel and the user's dm were locked.`))
        } else {
            //  Handle if target channel is invalid or cannot be found
            try {
                const channelFetch = await guild.channels.fetch(getTargetWelcomerChannel)
                if (channelFetch.type != ChannelType.GuildText && channelFetch.type != ChannelType.PublicThread) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                if (!guild.channels.cache.has(getTargetWelcomerChannel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                const ch = guild.channels.cache.get(getTargetWelcomerChannel)
                client.responseLibs(ch, true).send(getWelcomerText, {
                    simplified: true,
                    prebuffer: true,
                    image: renderedBanner
                })
            } catch (error) {
                client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                client.logger.error(error)
                return client.shard.broadcastEval(errorRelay, { context: { fileName: `guildMemberAdd.js`,errorType: `normal`, error_message: error.message, error_stack: error.stack, levelZeroErrors:levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
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
        for (let i = 0; i < welcomerRolesList.value.length; i++) {
            const roleId = welcomerRolesList.value[i]
            //  Handle if role cannot be found due to deleted/invalid
            if (!guild.roles.cache.has(roleId)) continue
            // If the user still needs to complete the discord membership gate for this guild
            if (member.pending) return
            member.roles.add(roleId)
        }
    }
}
