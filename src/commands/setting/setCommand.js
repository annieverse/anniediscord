const Confirmator = require(`../../libs/confirmator`)
/**
 * Set a specific channel for Annie's command usage..
 * @author klerikdust
 */
module.exports = {
    name: `setCommand`,
	aliases: [`setcommand`, `setcommands`, `setcmd`],
	description: `Set a specific channel for Annie's command usage.`,
	usage: `setcommand <channel/info/reset>`,
	group: `Setting`,
	permissionLevel: 3,
    configId: `COMMAND_CHANNELS`,
    async execute(client, reply, message, arg, locale, prefix) {
        const actions = [`channel`, `reset`]
        const currentCommandChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
		//  Handle if user doesn't specify the new bio/description
		if (!arg) return reply.send(locale.SETCOMMAND.GUIDE, {
            header: `Hi, ${message.author.username}!`,
			image: `banner_setcommand`,
			socket: {
                prefix: prefix,
                channelStatus: currentCommandChannels.length > 0 
                ? `currently there are total of ${currentCommandChannels.length} command channels in this server.`
                : `but since there are no command channel has been set, I'm currently listening to all the visible channels.`
            }
		})
        this.args = arg.split(` `)
        const targetAction = this.args[0].toLowerCase()
        if (!actions.includes(targetAction)) return reply.send(locale.SETCOMMAND.INVALID_ACTION, {
            socket: {prefix: prefix}
        })
        return this[targetAction](client, reply, message, arg, locale)
    },

    /**
     * Perform channel add action.
     * @return {void}
     */
    async channel(client, reply, message, arg, locale) {
        let channelsContainer = message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!this.args[1]) return reply.send(locale.SETCOMMAND.MISSING_TARGET_CHANNEL, {
            socket: {
                emoji: await client.getEmoji(`AnnieMad2`)
            }
        })
        const specifiedChannels = this.args.slice(1)
        const thinkingEmoji = await client.getEmoji(`692428969667985458`)
        const madEmoji = await client.getEmoji(`692428748838010970`)
        //  Iterate over multi channel registering
        for (let i=0; i<specifiedChannels.length; i++) {
            const ch = specifiedChannels[i].toLowerCase().replace(/[^0-9a-z-A-Z ]/g, ``)
            const targetNewChannel = message.guild.channels.cache.get(ch)
            || message.guild.channels.cache.find(channel => channel.name.toLowerCase() === ch)
            if (!targetNewChannel) return reply.send(locale.SETCOMMAND.INVALID_NEW_CHANNEL, {
                socket: {
                    channel: ch,
                    emoji: thinkingEmoji
                }
            })
            if (channelsContainer.includes(targetNewChannel.id)) return reply.send(locale.SETCOMMAND.CHANNEL_ALREADY_REGISTERED, {
                socket: {
                    emoji: madEmoji
                }
            })
            channelsContainer.push(targetNewChannel.id)
        }
        // Update existing pool
        client.db.updateGuildConfiguration({
            configCode: this.configId,
            customizedParameter: channelsContainer,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: message.guild.configs
        })
        return reply.send(locale.SETCOMMAND.UPDATE_CHANNEL_SUCCESSFUL, {
            status: `success`,
            socket: {
                channel: specifiedChannels.length,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
    }, 

    /**
     * Perform channel reset action.
     * @return {void} 
     */
    async reset(client, reply, message, arg, locale) {
        const currentChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!currentChannels.length) return reply.send(locale.SETCOMMAND.CHANNEL_POOL_ALREADY_EMPTY, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        const confirmation = await reply.send(locale.SETCOMMAND.RESET_CONFIRMATION, {
            header: `Reset command channels?`,
            socket: {
                totalChannels: currentChannels.length,
                emoji: await client.getEmoji(`692428785571856404`)
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            //  Reset configuration
            client.db.updateGuildConfiguration({
                configCode: this.configId,
                customizedParameter: [],
                guild: message.guild,
                setByUserId: message.author.id,
                cacheTo: message.guild.configs
            })
            return reply.send(locale.SETCOMMAND.RESET_SUCCESSFUL, {
                status: `success`,
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    }
}
