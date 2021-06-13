const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
const fs = require(`fs`)
const fetch = require(`node-fetch`)
const { v4: uuidv4 } = require(`uuid`)
const findRole = require(`../../utils/findRole`)

/**
 * Manage shop module for your guild.
 * @author klerikdust
 */
module.exports = {
    name: `setShop`,
    aliases: [`setshop`],
    description: `Manage shop module for your guild.`,
    usage: `setShop`,
    permissionLevel: 3,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`enable`, `disable`, `text`, `add`, `image`, `remove`, `edit`],

    /**
     * Reference key to welcomer sub-modules config code.
     * @type {object}
     */
    actionReference: {
        "enable": `SHOP_MODULE`,
        "disable": `SHOP_MODULE`,
        "text": `SHOP_TEXT`,
        "add": `SHOP_ITEM`,
        "image": `SHOP_IMAGE`,
        "remove": `SHOP_ITEM`,
        "edit": `SHOP_ITEM`
    },
    async execute(client, reply, message, arg, locale, prefix) {
        if (!arg) return reply.send(locale.SETSHOP.GUIDE, {
            image: `banner_setwelcomer`,
            header: `Hi, ${message.author.username}!`,
            socket: {
                prefix: prefix,
                emoji: await client.getEmoji(`692428660824604717`)
            }
        })
        this.args = arg.split(` `)
            //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return reply.send(locale.SETSHOP.INVALID_ACTION, {
                socket: { availableActions: this.actions.join(`, `) }
            })
            //  Run action
        this.annieRole = (await message.guild.members.fetch(client.user.id)).roles.highest
        this.guildConfigurations = message.guild.configs
        this.action = this.args[0]
        this.selectedModule = this.actionReference[this.action]
            //  This is the main configuration of setshop, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`SHOP_MODULE`)
            //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.selectedModule)
        return this[this.args[0].toLowerCase()](client, reply, message, arg, locale, prefix)
    },

    /**
     * Enabling welcomer module
     * @return {void}
     */
    async enable(client, reply, message, arg, locale, prefix) {
        if (this.primaryConfig.value) {
            const localizeTime = await client.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply.send(locale.SETSHOP.ALREADY_ENABLED, {
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
        return reply.send(locale.SETSHOP.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: { prefix: prefix }
        })
    },

    /**
     * Disabling welcomer module
     * @return {void}
     */
    async disable(client, reply, message, arg, locale, prefix) {
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, { socket: { prefix: prefix } })
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        return reply.send(locale.SETSHOP.SUCCESSFULLY_DISABLED, { status: `success` })
    },

    /**
     * Set message to be attached in the shop.
     * @return {void}
     */
    async text(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, { socket: { prefix: prefix } })
            //  Handle if text content isn't provided
        if (!this.args[1]) return reply.send(locale.SETSHOP.EMPTY_TEXT_PARAMETER, {
                socket: { prefix: prefix },
            })
            //  Update configs
        const shopText = this.args.slice(1).join(` `)
        client.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: shopText,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: this.guildConfigurations
        })
        await reply.send(locale.SETSHOP.TEXT_SUCCESSFULLY_REGISTERED, { status: `success` })
    },

    /**
     * Adding role when user joined the guild 
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, { socket: { prefix: prefix } })
        const activateModule = false
        if (!activateModule) return reply.send(`This setting is diabled`)

    },

    /**
     * Managing welcomer's image. 
     * @return {void}
     */
    async image(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })
        const { isValidUpload, url } = this.getImage(message)
        if (!url) return reply.send(locale.SETSHOP.IMAGE_MISSING_ATTACHMENT, {
            socket: {
                emoji: await client.getEmoji(`692428692999241771`),
                prefix: prefix
            }
        })
        if (!isValidUpload) return reply.send(locale.SETSHOP.IMAGE_INVALID_UPLOAD, {
            socket: {
                emoji: await client.getEmoji(`692428969667985458`)
            }
        })
        const id = uuidv4()
        const response = await fetch(url)
        const buffer = await response.buffer()
        await fs.writeFileSync(`./src/assets/customShop/${id}.png`, buffer)
        const confirmation = await reply.send(locale.SETSHOP.CONFIRMATION_IMAGE, {
            image: await new GUI(message.member, client, id).build(),
            prebuffer: true
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            client.db.updateGuildConfiguration({
                configCode: this.selectedModule,
                customizedParameter: id,
                guild: message.guild,
                setByUserId: message.author.id,
                cacheTo: this.guildConfigurations
            })
            reply.send(locale.SETSHOP.IMAGE_SUCCESSFULLY_APPLIED, {
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
            url: message.attachments.first() ?
                message.attachments.first().url : imageArgs.startsWith(`http`) && imageArgs.length >= 15 ?
                imageArgs : null
        }
    },

    /**
     * Remove an item
     * @return {void}
     */
    async remove(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })

        const activateModule = false
        if (!activateModule) return reply.send(`This setting is diabled`)

    },

    /**
     * Edit an item
     * @return {void}
     */
    async edit(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, {
            socket: { prefix: prefix }
        })

        const activateModule = false
        if (!activateModule) return reply.send(`This setting is diabled`)

    },

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @param {Message} message Current message instance
     * @private
     * @returns {string}
     */
    _parseText(message) {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        text = text.replace(/{{guild}}/gi, `**${message.guild.name}**`)
        text = text.replace(/{{user}}/gi, message.member)
        return text
    }
}