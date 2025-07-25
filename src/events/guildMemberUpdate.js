"use strict"
const Banner = require(`../ui/prebuild/welcomer`)
const { parseWelcomerText } = require(`../utils/welcomerFunctions.js`)
const { Collection, ChannelType, PermissionFlagsBits, GuildMemberFlags } = require(`discord.js`)
const { roleLower } = require(`../utils/roleCompare.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const levelZeroErrors = require(`../utils/errorLevels.js`)

module.exports = async function guildMemberUpdate(client, oldMember, newMember) {
    if (!client.isReady()) return
    if (!newMember) return
    if (newMember.partial) return
    if (oldMember.partial) return
    if (!newMember.guild.configs) return
    //  Import configs

    let instance = `[EVENTS@GUILD_MEMBER_UPDATE]`
    let guild = newMember.guild
    let configs = guild.configs

    let oldmemberFlags = oldMember.flags.serialize()
    let newmemberFlags = newMember.flags.serialize()

    if (oldmemberFlags.CompletedOnboarding) return // If member has already done onboarding finished onboarding 
    if (!oldmemberFlags.CompletedOnboarding && !newmemberFlags.CompletedOnboarding) return
    /**
     *  -------------------------------------------------------
     *  WELCOMER MODULE
     *  -------------------------------------------------------
     */
    if (configs.get(`WELCOMER_MODULE`).value) {
        if (!newMember.pending) {
            // Check if onboarding is enabled
            try {
                if ((await newMember.guild.fetchOnboarding()).enabled && !newMember.flags.has(GuildMemberFlags.CompletedOnboarding)) return
            } catch (error) {
                client.logger.error(error)
                return errorRelay(client, { fileName: `guildMemberUpdate.js`, errorType: `normal`, error_message: error.message, error_stack: error.stack, levelZeroErrors: levelZeroErrors }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
            }

            //  Prepare welcomer target channel
            let getTargetWelcomerChannel = configs.get(`WELCOMER_CHANNEL`).value
            //  Prepare welcomer banner img
            let renderedBanner = await new Banner(newMember, client).build()
            //  Prepare greeting text
            let welcomerText = configs.get(`WELCOMER_TEXT`)
            let getWelcomerText = parseWelcomerText(welcomerText.value, guild, newMember)

            if (!getTargetWelcomerChannel) {
                client.responseLibs(newMember, true)
                    .send(`__**A letter from ${guild.name}.**__\n` + getWelcomerText, {
                        simplified: true,
                        prebuffer: true,
                        image: renderedBanner
                    })
                    .catch(() => client.logger.warn(`${instance} failed to send the requested welcomer message due to there was no welcomer channel and the user's dm were locked.`))
            } else {
                /**
                 * Handle multiple channels
                 */
                if (configs.get(`WELCOMER_ADDITIONAL_CHANNELS`).value) {
                    let additionalChannels = configs.get(`WELCOMER_ADDITIONAL_CHANNELS`).value

                    let channelsWithText = new Collection(additionalChannels.map((obj) => [obj.channel, obj.text]))

                    for (const [channel, text] of channelsWithText) {
                        if (newMember.permissionsIn(channel).has(PermissionFlagsBits.ViewChannel)) {
                            //  Handle if target channel is invalid or cannot be found
                            if (!guild.channels.cache.has(channel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                            getWelcomerText = parseWelcomerText(text, guild, newMember)
                            const ch = guild.channels.cache.get(channel)
                            if (ch.type === ChannelType.GuildText || ch.type === ChannelType.PublicThread) {
                                client.responseLibs(ch, true)
                                    .send(getWelcomerText, {
                                        simplified: true,
                                        prebuffer: true,
                                        image: renderedBanner
                                    })
                            }
                            break

                        } else if (channelsWithText.lastKey() === channel) {
                            //  Handle if target channel is invalid or cannot be found
                            if (!guild.channels.cache.has(getTargetWelcomerChannel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                            const ch = guild.channels.cache.get(getTargetWelcomerChannel)
                            if (ch.type === ChannelType.GuildText && ch.type === ChannelType.PublicThread) {
                                client.responseLibs(ch, true)
                                    .send(getWelcomerText, {
                                        simplified: true,
                                        prebuffer: true,
                                        image: renderedBanner
                                    })
                            }
                        }
                    }
                } else {
                    /**
                     * Handle Single channels
                     */
                    //  Handle if target channel is invalid or cannot be found
                    if (!guild.channels.cache.has(getTargetWelcomerChannel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                    const ch = guild.channels.cache.get(getTargetWelcomerChannel)
                    if (ch.type === ChannelType.GuildText || ch.type === ChannelType.PublicThread) {
                        client.responseLibs(ch, true)
                            .send(getWelcomerText, {
                                simplified: true,
                                prebuffer: true,
                                image: renderedBanner
                            })
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
                if (!newMember.manageable) return
                if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return
                for (let i = 0; i < welcomerRolesList.value.length; i++) {
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
                newMember.roles.add(rolesToAdd).catch(error => {
                    client.logger.error(error)
                    errorRelay(client, { fileName: `guildMemberUpdate.js`, errorType: `normal`, error_message: error.message, error_stack: error.stack, levelZeroErrors: levelZeroErrors }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
                    // client.shard.broadcastEval(errorRelay, { context: { fileName: `guildMemberAdd.js`, errorType: `normal`, error_message: error.message, error_stack: error.stack, levelZeroErrors: levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
                })
            }
        }
    }
}
