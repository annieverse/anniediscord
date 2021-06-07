const Confirmator = require(`../../libs/confirmator`)
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
module.exports = {
    name: `setWelcomer`,
    aliases: [`setwelcomer`, `setwelcome`, `setwlcm`],
    description: `Manage welcomer module for your guild.`,
    usage: `setWelcomer`,
    permissionLevel: 3,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`enable`, `disable`, `channel`, `text`, `role`, `image`, `theme`, `preview`],

    /**
     * Reference key to welcomer sub-modules config code.
     * @type {object}
     */
    actionReference: {
        "enable": `WELCOMER_MODULE`,
        "disable": `WELCOMER_MODULE`,
        "channel": `WELCOMER_CHANNEL`,
        "text": `WELCOMER_TEXT`,
        "role": `WELCOMER_ROLES`,
        "image": `WELCOMER_IMAGE`,
        "theme": `WELCOMER_THEME`
    },
    async execute(client, reply, message, arg, locale) {
        if (!arg) return reply.send(locale.SETWELCOMER.GUIDE, {
            image: `banner_setwelcomer`,
            header: `Hi, ${message.author.username}!`,
            socket: {
                prefix: client.prefix,
                emoji: await client.getEmoji(`692428660824604717`)
            }
        })
        this.args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return reply.send(locale.SETWELCOMER.INVALID_ACTION, {
            socket: {availableActions: this.actions.join(`, `)}
        })   
        //  Run action
        this.annieRole = (await message.guild.members.fetch(client.user.id)).roles.highest
        this.guildConfigurations = message.guild.configs
        this.action = this.args[0]
        this.selectedModule = this.actionReference[this.action]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`WELCOMER_MODULE`)
        //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.selectedModule) 
        return this[this.args[0].toLowerCase()](client, reply, message, arg, locale)
    },
    
    /**
     * Enabling welcomer module
     * @return {void}
     */
    async enable(client, reply, message, arg, locale) {
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply.send(locale.SETWELCOMER.ALREADY_ENABLED, {
                socket: {
                    user: await client.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETWELCOMER.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: {prefix: client.prefix}
        })
    },

    /**
     * Disabling welcomer module
     * @return {void}
     */
    async disable(client, reply, message, arg, locale) {
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:client.prefix}})
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETWELCOMER.SUCCESSFULLY_DISABLED, {status: `success`})
    },

    /**
     * Set new target channel for welcomer module
     * @return {void}
     */
    async channel(client, reply, message, arg, locale) {
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:client.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return reply.send(locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {socket: {prefix:client.prefix}})
        //  Do channel searching by three possible conditions
        const searchChannel = message.mentions.channels.first()
        || message.guild.channels.cache.get(this.args[1])
        || message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return reply.send(locale.SETWELCOMER.INVALID_CHANNEL, {socket: {emoji: await client.getEmoji(`692428578683617331`)} })
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: searchChannel.id,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETWELCOMER.CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {channel: `<#${searchChannel.id}>`}
        })
    },

    /**
     * Set message to be attached in the welcomer.
     * @return {void}
     */
    async text(client, reply, message, arg, locale) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:client.prefix}}) 
        //  Handle if text content isn't provided
        if (!this.args[1]) return reply.send(locale.SETWELCOMER.EMPTY_TEXT_PARAMETER, {
            socket: {prefix: client.prefix},
        })
        //  Update configs
        const welcomerText = this.args.slice(1).join(` `)
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: welcomerText,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETWELCOMER.TEXT_SUCCESSFULLY_REGISTERED, {status: `success`})
        const tipsToPreview = await reply.send(locale.SETWELCOMER.TIPS_TO_PREVIEW, {simplified: true, socket: {emoji: await client.getEmoji(`692428927620087850`)} })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, tipsToPreview)
        c.onAccept(() => this.preview(client, reply, message, arg, locale))
    },

    /**
     * Preview this guild's welcomer message
     * @return {void}
     */
    async preview(client, reply, message, arg, locale) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:client.prefix}}) 
        const renderingMsg = await reply.send(locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                user: message.author.id,
                command: `WELCOMER_PREVIEW`,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        const img = await new GUI(message.member, client).build()
        renderingMsg.delete()
        return reply.send(this._parseWelcomeText(message), {
            simplified: true,
            prebuffer: true,
            image: img
        })
    },

    /**
     * Adding role when user joined the guild 
     * @return {void}
     */
    async role(client, reply, message, arg, locale) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:client.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return reply.send(locale.SETWELCOMER.EMPTY_ROLE_PARAMETER, {
            socket: {prefix: client.prefix},
            status: `warn`
        })
        let rolesContainer = []
        let specifiedRoles = this.args.slice(1)
        for (let i=0; i<specifiedRoles.length; i++) {
            //  Do role searching
            const searchRole = findRole(specifiedRoles[i], message.guild)
            //  Handle if target role couldn't be found
            if (!searchRole) return reply.send(locale.SETWELCOMER.INVALID_ROLE, {status: `fail`})
            //  Handle if role is higher than annie
            if (searchRole.position > this.annieRole.position) return reply.send(locale.SETWELCOMER.ROLE_TOO_HIGH, {
                socket: {
                    role: searchRole,
                    annieRole: this.annieRole.name,
                    emoji: await client.getEmoji(`692428578683617331`)
                }
            })
            rolesContainer.push(searchRole)
        }
        //  Update configs
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: rolesContainer.map(role => role.id),
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETWELCOMER.ROLE_SUCCESSFULLY_REGISTERED, {
            socket: {role: rolesContainer.join(` `)},
            status: `success`
        })
    },

	/**
	 * Managing welcomer's image. 
	 * @return {void}
	 */
	async image(client, reply, message, arg, locale) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
			socket: {prefix: client.prefix}
		}) 
		const { isValidUpload, url } = this.getImage(message)
		if (!url) return reply.send(locale.SETWELCOMER.IMAGE_MISSING_ATTACHMENT, {
			socket: {
				emoji: await client.getEmoji(`692428692999241771`),
				prefix: client.prefix
			}
		})	
		if (!isValidUpload) return reply.send(locale.SETWELCOMER.IMAGE_INVALID_UPLOAD, {
			socket: {
				emoji: await client.getEmoji(`692428969667985458`) 
			}	
		})
        const id = uuidv4()
        const response = await fetch(url)
        const buffer = await response.buffer()
        await fs.writeFileSync(`./src/assets/customWelcomer/${id}.png`, buffer)
		const confirmation = await reply.send(locale.SETWELCOMER.CONFIRMATION_IMAGE, {
        	image: await new GUI(message.member, client, id).build(),
			prebuffer: true
		})		
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
			client.db.updateGuildConfiguration({
				configCode: this.selectedModule,
				customizedParameter: id, 
				guild: message.guild,
				setByUserId: message.author.id,
				cacheTo: this.guildConfigurations
			})
            reply.send(locale.SETWELCOMER.IMAGE_SUCCESSFULLY_APPLIED, {
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
	},
	
	/** 
     * Check if user has attempted to upload a custom image
     * @param {Message} message Current message instance
     * @return {object}
     */
    getImage(message) {
        const hasAttachment = message.attachments.first() ? true : false
		const imageArgs = this.args.slice(1).join(` `)
        const hasImageURL = imageArgs.startsWith(`http`) && imageArgs.length >= 15 ? true : false 
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: message.attachments.first() 
            ? message.attachments.first().url
            : imageArgs.startsWith(`http`) && imageArgs.length >= 15
            ? imageArgs
            : null
        }
    },

	/**
	 * Theme management
	 * @return {void}
	 */
	async theme(client, reply, message, arg, locale) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETWELCOMER.ALREADY_DISABLED, {
			socket: {prefix: client.prefix}
		}) 
		if (!this.args[1]) return reply.send(locale.SETWELCOMER.THEME_MISSING_NAME, {
			socket: {
				prefix: client.prefix,
				emoji: await client.getEmoji(`AnniePeek1`)
			}
		})
		const availableThemes = [`light`, `dark`]
		if (!availableThemes.includes(this.args[1])) return reply.send(locale.SETWELCOMER.THEME_INVALID, {
			socket: {
				emoji: await client.getEmoji(`AnnieMad`)
			}
		})
		client.db.updateGuildConfiguration({
				configCode: this.selectedModule,
				customizedParameter: this.args[1], 
				guild: message.guild,
				setByUserId: message.author.id,
				cacheTo: this.guildConfigurations
			})
		return reply.send(locale.SETWELCOMER.THEME_SUCCESSFULLY_UPDATED, {
			status: `success`,
			socket: {
				theme: this.args[1],
				user: message.author.username,
				emoji: await client.getEmoji(`789212493096026143`)
			}
		})
	},

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @param {Message} message Current message instance
     * @private
     * @returns {string}
     */
    _parseWelcomeText(message) {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        text = text.replace(/{{guild}}/gi, `**${message.guild.name}**`)
        text = text.replace(/{{user}}/gi, message.member)
        return text
    }
}
