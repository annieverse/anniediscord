const Command = require(`../../libs/commands`)
/**
 * Set a specific channel for Annie's command usage..
 * @author klerikdust
 */
class SetCommand extends Command {
    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
        this.configId = `COMMAND_CHANNELS`
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        const actions = [`channel`, `reset`]
        const currentCommandChannels = this.message.guild.configs.get(`COMMAND_CHANNELS`).value
		//  Handle if user doesn't specify the new bio/description
		if (!this.fullArgs) return this.reply(this.locale.SETCOMMAND.GUIDE, {
            header: `Hi, ${this.message.author.username}!`,
			image: `banner_setcommand`,
			socket: {
                prefix: this.bot.prefix,
                channelStatus: currentCommandChannels.length > 0 
                ? `currently there are total of ${currentCommandChannels.length} command channels in this server.`
                : `but since there are no command channel has been set, I'm currently listening to all the visible channels.`
            }
		})
        const targetAction = this.args[0].toLowerCase()
        if (!actions.includes(targetAction)) return this.reply(this.locale.SETCOMMAND.INVALID_ACTION, {
            socket: {prefix: this.bot.prefix}
        })
        return this[targetAction]()
	}

    /**
     * Perform channel add action.
     * @return {void}
     */
    async channel() {
        let channelsContainer = this.message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!this.args[1]) return this.reply(this.locale.SETCOMMAND[channelsContainer.length > 0 ? `CHANNEL_INFO` : `CHANNEL_GUIDE`], {
            socket: {
                channels: this._identifyChannels(channelsContainer)
            }
        })
        const specifiedChannels = this.args.slice(1)
        const thinkingEmoji = await this.bot.getEmoji(`692428969667985458`)
        const madEmoji = await this.bot.getEmoji(`692428748838010970`)
        //  Iterate over multi channel registering
        for (let i=0; i<specifiedChannels.length; i++) {
            const ch = specifiedChannels[i].toLowerCase().replace(/[^0-9a-z-A-Z ]/g, ``)
            const targetNewChannel = this.message.guild.channels.cache.get(ch)
            || this.message.guild.channels.cache.find(channel => channel.name.toLowerCase() === ch)
            if (!targetNewChannel) return this.reply(this.locale.SETCOMMAND.INVALID_NEW_CHANNEL, {
                socket: {
                    channel: ch,
                    emoji: thinkingEmoji
                }
            })
            if (channelsContainer.includes(targetNewChannel.id)) return this.reply(this.locale.SETCOMMAND.CHANNEL_ALREADY_REGISTERED, {
                socket: {
                    emoji: madEmoji
                }
            })
            channelsContainer.push(targetNewChannel.id)
        }
        // Update existing pool
        this.bot.db.updateGuildConfiguration({
            configCode: this.configId,
            customizedParameter: channelsContainer,
            guild: this.message.guild,
            setByUserId: this.message.author.id,
            cacheTo: this.message.guild.configs
        })
        return this.reply(this.locale.SETCOMMAND.UPDATE_CHANNEL_SUCCESSFUL, {
            status: `success`,
            socket: {
                channel: specifiedChannels.length,
                emoji: await this.bot.getEmoji(`789212493096026143`)
            }
        })
    } 

    /**
     * Perform channel reset action.
     * @return {void} 
     */
    async reset() {
        const currentChannels = this.message.guild.configs.get(`COMMAND_CHANNELS`).value
        if (!currentChannels.length) return this.reply(this.locale.SETCOMMAND.CHANNEL_POOL_ALREADY_EMPTY)
        const confirmation = await this.reply(this.locale.SETCOMMAND.RESET_CONFIRMATION, {
            header: `Reset command channels?`,
            socket: {
                totalChannels: currentChannels.length,
                emoji: await this.bot.getEmoji(`692428785571856404`)
            }
        })
        await this.addConfirmationButton(`COMMAND_CHANNELS_RESET`, confirmation, this.message.author.id)
        this.confirmationButtons.get(`COMMAND_CHANNELS_RESET`).on(`collect`, async r => {
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            //  Reset configuration
            this.bot.db.updateGuildConfiguration({
                configCode: this.configId,
                customizedParameter: [],
                guild: this.message.guild,
                setByUserId: this.message.author.id,
                cacheTo: this.message.guild.configs
            })
            return this.reply(this.locale.SETCOMMAND.RESET_SUCCESSFUL, {
                status: `success`,
                socket: {
                    emoji: await this.bot.getEmoji(`789212493096026143`)
                }
            })
        })
    }

    /**
     * Parsing channels id in COMMAND_CHANNELS pool.
     * @param {object} [src=[]] Target pool.
     * @return {string}
     */
    _identifyChannels(src=[]) {
        let str = ``
        for (let i=0; i<src.length; i++) {
            const channel = this.message.guild.channels.cache.get(src[i])
            str += channel || `(Channel Deleted)`
            if (i < src.length) str += `, `
            if (i === (src.length - 1)) str += `and `
        }
        return str
    }
}

module.exports.help = {
	start: SetCommand,
	name: `setCommand`,
	aliases: [`setcommand`, `setcommands`, `setcmd`],
	description: `Set a specific channel for Annie's command usage.`,
	usage: `setcommand <channel/info/reset>`,
	group: `Setting`,
	permissionLevel: 3
}
