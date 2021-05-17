const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
const fs = require(`fs`)
const fetch = require(`node-fetch`)
const { v4: uuidv4 } = require(`uuid`)
const findRole = require(`../../utils/findRole`)

/**
 * Manage welcomer module for your guild.
 * @author klerikdust
 */
class SetWelcomer extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * An array of the available options for welcomer module
         * @type {array}
         */
        this.actions = [`enable`, `disable`, `channel`, `text`, `role`, `image`, `theme`, `preview`]

        /**
         * Reference key to welcomer sub-modules config code.
         * @type {object}
         */
        this.actionReference = {
            "enable": `WELCOMER_MODULE`,
            "disable": `WELCOMER_MODULE`,
            "channel": `WELCOMER_CHANNEL`,
            "text": `WELCOMER_TEXT`,
            "role": `WELCOMER_ROLES`,
			"image": `WELCOMER_IMAGE`,
			"theme": `WELCOMER_THEME`
        }
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        await this.requestUserMetadata(1)
        if (!this.fullArgs) return this.reply(this.locale.SETWELCOMER.GUIDE, {
            image: `banner_setwelcomer`,
            header: `Hi, ${this.user.master.username}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: await this.bot.getEmoji(`692428660824604717`)
            }
        })
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return this.reply(this.locale.SETWELCOMER.INVALID_ACTION, {
            socket: {availableActions: this.actions.join(`, `)}
        })   
        //  Run action
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.action = this.args[0]
        this.selectedModule = this.actionReference[this.action]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`WELCOMER_MODULE`)
        //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.selectedModule) 
        return this[this.args[0].toLowerCase()]()
    }

    /**
     * Enabling welcomer module
     * @return {void}
     */
    async enable() {
        if (this.primaryConfig.value) {
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return this.reply(this.locale.SETWELCOMER.ALREADY_ENABLED, {
                socket: {
                    user: await this.bot.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 1,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETWELCOMER.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: {prefix: this.bot.prefix}
        })
    }

    /**
     * Disabling welcomer module
     * @return {void}
     */
    async disable() {
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}})
        this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETWELCOMER.SUCCESSFULLY_DISABLED, {status: `success`})
    }

    /**
     * Set new target channel for welcomer module
     * @return {void}
     */
    async channel() {
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return this.reply(this.locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {socket: {prefix:this.bot.prefix}})
        //  Do channel searching by three possible conditions
        const searchChannel = this.message.mentions.channels.first()
        || this.message.guild.channels.cache.get(this.args[1])
        || this.message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return this.reply(this.locale.SETWELCOMER.INVALID_CHANNEL, {socket: {emoji: await this.bot.getEmoji(`692428578683617331`)} })
        this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: searchChannel.id,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETWELCOMER.CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {channel: `<#${searchChannel.id}>`}
        })
    }

    /**
     * Set message to be attached in the welcomer.
     * @return {void}
     */
    async text() {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if text content isn't provided
        if (!this.args[1]) return this.reply(this.locale.SETWELCOMER.EMPTY_TEXT_PARAMETER, {
            socket: {prefix: this.bot.prefix},
        })
        //  Update configs
        const welcomerText = this.args.slice(1).join(` `)
        this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: welcomerText,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        await this.reply(this.locale.SETWELCOMER.TEXT_SUCCESSFULLY_REGISTERED, {status: `success`})
        this.tipsToPreview = await this.reply(this.locale.SETWELCOMER.TIPS_TO_PREVIEW, {simplified: true, socket: {emoji: await this.bot.getEmoji(`692428927620087850`)} })
        await this.addConfirmationButton(`SHOULD_PREVIEW?`, this.tipsToPreview, this.user.master.id)
        this.confirmationButtons.get(`SHOULD_PREVIEW?`).on(`collect`, () => this.preview())
    }

    /**
     * Preview this guild's welcomer message
     * @return {void}
     */
    async preview() {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        this.renderingMsg = await this.reply(this.locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                user: this.user.master.id,
                command: `WELCOMER_PREVIEW`,
                emoji: await this.bot.getEmoji(`790994076257353779`)
            }
        })
        const img = await new GUI(this.message.member, this.bot).build()
        this.renderingMsg.delete()
        return this.reply(this._parseWelcomeText(), {
            simplified: true,
            prebuffer: true,
            image: img
        })
    }

    /**
     * Adding role when user joined the guild 
     * @return {void}
     */
    async role() {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return this.reply(this.locale.SETWELCOMER.EMPTY_ROLE_PARAMETER, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        let rolesContainer = []
        let specifiedRoles = this.args.slice(1)
        for (let i=0; i<specifiedRoles.length; i++) {
            //  Do role searching
            const searchRole = findRole(specifiedRoles[i], this.message.guild)
            //  Handle if target role couldn't be found
            if (!searchRole) return this.reply(this.locale.SETWELCOMER.INVALID_ROLE, {status: `fail`})
            //  Handle if role is higher than annie
            if (searchRole.position > this.annieRole.position) return this.reply(this.locale.SETWELCOMER.ROLE_TOO_HIGH, {
                color: `crimson`,
                socket: {
                    role: searchRole,
                    annieRole: this.annieRole.name,
                    emoji: await this.bot.getEmoji(`692428578683617331`)
                }
            })
            rolesContainer.push(searchRole)
        }
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: rolesContainer.map(role => role.id),
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        return this.reply(this.locale.SETWELCOMER.ROLE_SUCCESSFULLY_REGISTERED, {
            socket: {role: rolesContainer.join(` `)},
            status: `success`
        })
    }

	/**
	 * Managing welcomer's image. 
	 * @return {void}
	 */
	async image() {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {
			socket: {prefix: this.bot.prefix}
		}) 
		const { isValidUpload, url } = this.getImage()
		if (!url) return this.reply(this.locale.SETWELCOMER.IMAGE_MISSING_ATTACHMENT, {
			socket: {
				emoji: await this.bot.getEmoji(`692428692999241771`),
				prefix: this.bot.prefix
			}
		})	
		if (!isValidUpload) return this.reply(this.locale.SETWELCOMER.IMAGE_INVALID_UPLOAD, {
			socket: {
				emoji: await this.bot.getEmoji(`692428969667985458`) 
			}	
		})
        const id = uuidv4()
		try {
			const response = await fetch(url)
			const buffer = await response.buffer()
			await fs.writeFileSync(`./src/assets/customWelcomer/${id}.png`, buffer)
		}
		catch (e) {
			return this.logger.error(`Fail to render custom welcomer image. > ${e.stack}`)
		}
		const confirmation = await this.reply(this.locale.SETWELCOMER.CONFIRMATION_IMAGE, {
        	image: await new GUI(this.message.member, this.bot, id).build(),
			prebuffer: true
		})		
		await this.addConfirmationButton(`applyCustomWelcomerImage`, confirmation)
        return this.confirmationButtons.get(`applyCustomWelcomerImage`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
			this.bot.db.updateGuildConfiguration({
				configCode: this.selectedModule,
				customizedParameter: id, 
				guild: this.message.guild,
				setByUserId: this.message.author.id,
				cacheTo: this.guildConfigurations
			})
            //  Finalize
            this.finalizeConfirmation(r)
            this.reply(this.locale.SETWELCOMER.IMAGE_SUCCESSFULLY_APPLIED, {
                socket: {
                    emoji: await this.bot.getEmoji(`789212493096026143`)
                }
            })
        })
	}
	
	/** 
     * Check if user has attempted to upload a custom image
     * @return {object}
     */
    getImage() {
        const hasAttachment = this.message.attachments.first() ? true : false
		const imageArgs = this.args.slice(1).join(` `)
        const hasImageURL = imageArgs.startsWith(`http`) && imageArgs.length >= 15 ? true : false 
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: this.message.attachments.first() 
            ? this.message.attachments.first().url
            : imageArgs.startsWith(`http`) && imageArgs.length >= 15
            ? imageArgs
            : null
        }
    }

	/**
	 * Theme management
	 * @return {void}
	 */
	async theme() {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return this.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {
			socket: {prefix: this.bot.prefix}
		}) 
		if (!this.args[1]) return this.reply(this.locale.SETWELCOMER.THEME_MISSING_NAME, {
			socket: {
				prefix: this.bot.prefix,
				emoji: await this.bot.getEmoji(`AnniePeek1`)
			}
		})
		const availableThemes = [`light`, `dark`]
		if (!availableThemes.includes(this.args[1])) return this.reply(this.locale.SETWELCOMER.THEME_INVALID, {
			socket: {
				emoji: await this.bot.getEmoji(`AnnieMad`)
			}
		})
		this.bot.db.updateGuildConfiguration({
				configCode: this.selectedModule,
				customizedParameter: this.args[1], 
				guild: this.message.guild,
				setByUserId: this.message.author.id,
				cacheTo: this.guildConfigurations
			})
		return this.reply(this.locale.SETWELCOMER.THEME_SUCCESSFULLY_UPDATED, {
			status: `success`,
			socket: {
				theme: this.args[1],
				user: this.message.author.username,
				emoji: await this.bot.getEmoji(`789212493096026143`)
			}
		})
	}

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @private
     * @returns {string}
     */
    _parseWelcomeText() {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        text = text.replace(/{{guild}}/gi, `**${this.message.guild.name}**`)
        text = text.replace(/{{user}}/gi, this.message.member)
        return text
    }
}

module.exports.help = {
    start: SetWelcomer,
    name: `setWelcomer`,
    aliases: [`setwelcomer`, `setwelcome`, `setwlcm`],
    description: `Manage welcomer module for your guild.`,
    usage: `setWelcomer`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}

