"use strict"
const Banner = require(`../ui/prebuild/welcomer`)
const { parseWelcomerText } = require(`../utils/welcomerFunctions.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const { ChannelType, PermissionFlagsBits, GuildMemberFlags } = require(`discord.js`)
const { roleLower } = require(`../utils/roleCompare.js`)

module.exports = async function guildMemberAdd(client, member) {
    if (!client.isReady()) return
    if (member.partial) return
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
        try {
            const onboardingEnabled = (await member.guild.fetchOnboarding()).enabled
            if (onboardingEnabled && configs.get(`WELCOMER_ONBOARDWAIT`).value) return
            if (onboardingEnabled && !member.flags.has(GuildMemberFlags.CompletedOnboarding)) return
        } catch (error) {
            client.logger.error(error)
            const errorMsg = error.message || `Unknown Error`
            const errorStack = error.stack || `Unknown Error Stack`
            return errorRelay(client, { fileName: `guildMemberAdd.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        }

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
                if (!guild.channels.cache.has(getTargetWelcomerChannel)) throw new Error(`[Internal Error] invalid target channel`)
                const ch = guild.channels.cache.get(getTargetWelcomerChannel)
                if (!ch) throw new Error(`[Internal Error] invalid target channel`)
                if (ch.type != ChannelType.GuildText && ch.type != ChannelType.PublicThread) throw new Error(`[Internal Error] invalid target channel`)
                client.responseLibs(ch, true).send(getWelcomerText, {
                    simplified: true,
                    prebuffer: true,
                    image: renderedBanner
                }).catch(error => {
                    const internalError = error.message.startsWith(`[Internal Error]`)
                    if (internalError) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                    client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id} \n> Attempted Channel: ${getTargetWelcomerChannel} \n> error: ${error} \n> ${error.stack}`)
                    client.logger.error(error)
                    const errorMsg = error.message || `Unknown Error`
                    const errorStack = error.stack || `Unknown Error Stack`
                    errorRelay(client, { fileName: `guildMemberAdd.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
                    return
                })
            } catch (error) {
                const internalError = error.message.startsWith(`[Internal Error]`)
                if (internalError) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id} \n> Attempted Channel: ${getTargetWelcomerChannel} \n> error: ${error} \n> ${error.stack}`)
                client.logger.error(error)
                const errorMsg = error.message || `Unknown Error`
                const errorStack = error.stack || `Unknown Error Stack`
                errorRelay(client, { fileName: `guildMemberAdd.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
                return
            }
        }
        /**
         *  -------------------------------------------------------
         *  WELCOMER'S AUTOROLE MODULE
         *  -------------------------------------------------------
         */
        //  Skip role assignment if no roles are registered
        const welcomerRolesList = configs.get(`WELCOMER_ROLES`)
        const rolesToAdd = []
        if (welcomerRolesList.value.length <= 0) return
        if (!member.manageable) return
        if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return
        for (let i = 0; i < welcomerRolesList.value.length; i++) {
            // If the user still needs to complete the discord membership gate for this guild
            if (member.pending) return
            const roleId = welcomerRolesList.value[i]
            if (typeof roleId != `string`) continue
            //  Handle if role cannot be found due to deleted/invalid
            if (!guild.roles.cache.has(roleId)) continue
            const role = guild.roles.cache.get(roleId)
            if (!role) continue
            if (role.managed) continue
            if (!role.editable) continue

            const botsHighestRole = guild.members.me.roles.highest // Highest role the bot has
            if (roleLower(role.id, botsHighestRole, guild)) rolesToAdd.push(role.id)

        }
        member.roles.add(rolesToAdd).catch(error => {
            client.logger.error(error)
            const errorMsg = error.message || `Unknown Error`
            const errorStack = error.stack || `Unknown Error Stack`
            errorRelay(client, { fileName: `guildMemberAdd.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(err => client.logger.error(`[rolesToAdd] Unable to send message to channel > ${err}`))
        })
    }
}
