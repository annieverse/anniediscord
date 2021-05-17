const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/levelUpMessage`)
const moment = require(`moment`)
/**
 * Enable or disable level-up message module for this guild
 * @author klerikdust
 */
class SetLevelupMessage extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * An array of the available options for welcomer module
         * @type {array}
         */
        this.actions = [`enable`, `disable`, `channel`, `text`]

        /**
         * Current instance's config code
         * @type {string}
         */  
        this.primaryConfigID = `LEVEL_UP_MESSAGE`

        /**
         * Thumbnail's img source
         * @type {string}
         */
         this.thumbnail = `https://i.ibb.co/Kwdw0Pc/config.png`
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        await this.requestUserMetadata(2)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return this.reply(this.locale.SETLEVELUPMESSAGE.GUIDE, {
            header: `Hi, ${this.user.master.username}!`,
            thumbnail: this.thumbnail,
            socket: {
                prefix: this.bot.prefix,
                emoji: await this.bot.getEmoji(`692428660824604717`)
            }
        })
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return this.reply(this.locale.SETLEVELUPMESSAGE.INVALID_ACTION, {
            socket: {actions: this.actions.join(`, `)},
        })   
        //  Run action
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction]()
    }

    /**
     * Enabling levelup-message module
     * @return {void}
     */
    async enable() {
        const fn = `[setLevelupMessage.enable()]`
        //  Handle if module already enabled before the action.
        if (this.primaryConfig.value) {
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return this.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_ENABLED, {
                socket: {
                    user: await this.bot.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_ENABLED, {
            socket: {prefix: this.bot.prefix},
            status: `success`
        })
    }

    /**
     * Disabling levelup-message module.
     * @return {void}
     */
    async disable() {
        const fn = `[setLevelupMessage.disable()]`
        //  Handle if module already disabled before the action.
        if (!this.primaryConfig.value) return this.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket:{prefix:this.bot.prefix}
        })
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_DISABLED, {status: `success`})
    }

    /**
     * Registering custom channel for the level-up message.
     * @return {}
     */
    async channel() {
        const fn = `[setLevelupMessage.channel]`
        const subConfigId = `LEVEL_UP_MESSAGE_CHANNEL`
        //  Handle if module hasn't been enabled yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket:{prefix:this.bot.prefix}
        })
        //  Handle if the custom channel already present
        const customLevelUpMessageChannel = this.guildConfigurations.get(subConfigId).value
        if (customLevelUpMessageChannel) {
            //  Handle if no channel parameter has been inputted
            const { isExists, res } = this._getChannel(customLevelUpMessageChannel)
            const displayingExistingData = isExists ? `DISPLAY_REGISTERED_CHANNEL` : `DISPLAY_UNREACHABLE_CHANNEL`
            if (!this.args[1]) return this.reply(this.locale.SETLEVELUPMESSAGE[displayingExistingData], {
                socket: {
                    prefix: this.bot.prefix,
                    channel: res || customLevelUpMessageChannel
                }
            })
            //  Handle if user has asked to reset the custom channel
            if (this.args[1] === `reset`) {
                //  Update and finalize
                this.bot.db.updateGuildConfiguration({
                    configCode: subConfigId,
                    customizedParameter: ``,
                    guild: this.message.guild,
                    setByUserId: this.user.master.id,
                    cacheTo: this.guildConfigurations
                })
                this.logger.info(`${fn} ${subConfigId} successfully reset channel for GUILD_ID:${this.message.guild.id}.`)
                return this.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_RESET_CHANNEL, {
                    status: `success`,
                    socket: {emoji: await this.bot.getEmoji(`789212493096026143`)}
                })
            }
        }
        else {
            //  Handle if no channel parameter has been inputted
            if (!this.args[1]) return this.reply(this.locale.SETLEVELUPMESSAGE.MISSING_CHANNEL_PARAMETER, {
                socket: {prefix: this.bot.prefix}
            })
        }
        //  Handle if target channel does not exist
        const { isExists, res } = this._getChannel(this.args[1])
        if (!isExists) return this.reply(this.locale.SETLEVELUPMESSAGE.INVALID_CHANNEL, {
            socket: {emoji: await this.bot.getEmoji(`692428578683617331`)}
        })
        //  Update and finalize
        this.bot.db.updateGuildConfiguration({
            configCode: subConfigId,
            customizedParameter: res.id,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${subConfigId} successfully set CHANNEL_ID:${res.id} for GUILD_ID:${this.message.guild.id}.`)
        return this.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_SET_CHANNEL, {
            status: `success`,
            socket: {
                channel: res,
                emoji: await this.bot.getEmoji(`789212493096026143`)
            }
        })
    }

    /**
     * Customizing the content of level up message.
     * @return {void}
     */
     async text() {
        const fn = `[setLevelupMessage.text]`
        const subConfigId = `LEVEL_UP_TEXT`
        if (!this.primaryConfig.value) return this.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket:{prefix:this.bot.prefix}
        })
        if (!this.args[1]) return this.reply(this.locale.SETLEVELUPMESSAGE.MISSING_TEXT_PARAMETER, {
            socket:{prefix:this.bot.prefix}
        })
        let newText = this.args.slice(1).join(` `)
        //  Dummy level-up message for the preview
        await this.reply(newText, {
            prebuffer: true,
            simplified: true,
            image: await new GUI(this.user, 60).build(),
            socket: {
                user: this.message.author
            }
        })
        const confirmation = await this.reply(this.locale.SETLEVELUPMESSAGE.TEXT_CONFIRMATION)		
		await this.addConfirmationButton(`applyCustomLevelUpText`, confirmation)
        return this.confirmationButtons.get(`applyCustomLevelUpText`).on(`collect`, async r => {
            if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
            })
            this.bot.db.updateGuildConfiguration({
                configCode: subConfigId,
                customizedParameter: newText,
                guild: this.message.guild,
                setByUserId: this.user.master.id,
                cacheTo: this.guildConfigurations
            })
            this.logger.debug(`${fn} ${this.subConfigId} for GUILD_ID:${this.message.guild.id} has been updated.`)
            this.finalizeConfirmation(r)
 			this.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_UPDATE_TEXT, {
                status: `success`,
                socket: {
                    emoji: await this.bot.getEmoji(`789212493096026143`)
                }
            })
        })
     }

    /**
     * Fetching channel in the guild
     * @param {*} channelKeyword
     * @return {object}
     */
    _getChannel(channelKeyword) {
        //  Omit surrounded symbols if user using #mention method to be used as the searchstring keyword
        channelKeyword = channelKeyword.replace(/[^0-9a-z-A-Z ]/g, ``)
        const channels = this.message.guild.channels.cache
        const channel = channels.get(channelKeyword) || channels.find(node => node.name.toLowerCase() === channelKeyword.toLowerCase()) 
        return {
            isExists: channel ? true : false,
            res: channel
        }
    }
}

module.exports.help = {
    start: SetLevelupMessage,
    name: `setLevelupMessage`,
    aliases: [`setlevelupmsg`, `setlvlupmsg`, `setlvlupmessage`, `setlevelupmessage`],
    description: `Enable or disable level-up message module for this guild`,
    usage: `setlvlupmsg <Enable/Disable>`,
    group: `Setting`,
    permissionLevel: 3
}

