"use strict"
const Banner = require(`../ui/prebuild/welcomer`)
const { parseWelcomerText } = require(`../utils/welcomerFunctions.js`)
const { Collection } = require(`discord.js`)
module.exports = async function guildMemberUpdate(client, oldMember, newMember) {
    await newMember.fetch()
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
                newMember.roles.add(roleId)
            }
        }

        if (!configs.get(`WELCOMER_ONBOARDWAIT`).value) return
        //  Prepare welcomer target channel
        let getTargetWelcomerChannel = configs.get(`WELCOMER_CHANNEL`).value
        //  Prepare welcomer banner img
        let renderedBanner = await new Banner(newMember, client).build()
        //  Prepare greeting text
        let welcomerText = configs.get(`WELCOMER_TEXT`)
        let getWelcomerText = parseWelcomerText(welcomerText.value, guild, newMember)
        //  Attempt to DM the joined user if guild's owner hasn't setup the welcomer channel yet
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
            if (configs.get(`WELCOMER_ADDITIONAL_CHANNELS`)) {
                let additional_channels = configs.get(`WELCOMER_ADDITIONAL_CHANNELS`).value

                let channelsWithText = new Collection(additional_channels.map((obj) => [obj.channel, obj.text]))

                for (const [channel, text] of channelsWithText) {
                    if (newMember.permissionsIn(channel).has(`ViewChannel`)) {
                        //  Handle if target channel is invalid or cannot be found
                        if (!guild.channels.cache.has(channel)) return client.logger.warn(`${instance} failed to send welcomer message due to invalid target channel in GUILD_ID:${guild.id}`)
                        getWelcomerText = parseWelcomerText(text, guild, newMember)
                        const ch = guild.channels.cache.get(channel)

                        client.responseLibs(ch, true)
                            .send(getWelcomerText, {
                                simplified: true,
                                prebuffer: true,
                                image: renderedBanner
                            })
                        break
                    }
                }
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


        }

    }
}
