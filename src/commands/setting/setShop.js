const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
const ms = require(`ms`)
const fs = require(`fs`)
const fetch = require(`node-fetch`)
const { v4: uuidv4 } = require(`uuid`)
const findRole = require(`../../utils/findRole`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)

/**
 * Create, restock & sell items for your server members!
 * @author klerikdust
 */
module.exports = {
    name: `setShop`,
    aliases: [`setshop`, `setshops`],
    description: `Create, restock & sell items for your server members!`,
    usage: `setShop`,
    permissionLevel: 3,
    /**
     * An array of the available options for welcomer module
     * @type {array}
     */
    actions: [`open`, `close`, `text`, `image`, `add`, `delete`, `edit`, `restock`, `reset`],

    /**
     * Reference key to welcomer sub-modules config code.
     * @type {object}
     */
    actionReference: {
        "open": `SHOP_MODULE`,
        "close": `SHOP_MODULE`,
        "text": `SHOP_TEXT`,
        "image": `SHOP_IMAGE`,
        "add": `SHOP_ITEM`,
        "delete": `SHOP_ITEM`,
        "edit": `SHOP_ITEM`,
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
        const args = arg.split(` `)
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(args[0].toLowerCase())) return reply.send(locale.SETSHOP.INVALID_ACTION, {
                socket: { availableActions: this.actions.join(`, `) }
            })
        //  Run action
        return this[args[0].toLowerCase()](client, reply, message, arg, locale, prefix, args)
    },

    /**
     * Enabling shop module
     * @return {void}
     */
    async open(client, reply, message, arg, locale, prefix) {
        const targetConfig = message.guild.configs.get(`SHOP_MODULE`)
        client.db.updateGuildConfiguration({
            configCode: `SHOP_MODULE`,
            customizedParameter: 1,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: message.guild.configs
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
    async close(client, reply, message, arg, locale, prefix) {
        const targetConfig = message.guild.configs.get(`SHOP_MODULE`)
        client.db.updateGuildConfiguration({
            configCode: `SHOP_MODULE`,
            customizedParameter: 0,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: message.guild.configs
        })
        return reply.send(locale.SETSHOP.SUCCESSFULLY_DISABLED)
    },

    /**
     * Set message to be attached in the shop.
     * @return {void}
     */
    async text(client, reply, message, arg, locale, prefix, args) {
        //  Handle if text content isn't provided
        const param = args.slice(1).join(` `)
        if (!param) return reply.send(locale.SETSHOP.EMPTY_TEXT_PARAMETER, {
            socket: { prefix: prefix },
        })
        //  Update configs
        client.db.updateGuildConfiguration({
            configCode: `SHOP_TEXT`,
            customizedParameter: param,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: message.guild.configs
        })
        return reply.send(locale.SETSHOP.TEXT_SUCCESSFULLY_REGISTERED, { status: `success` })
    },

    /**
     * Adding item to shop
     * @return {void}
     */
    async add(client, reply, message, arg, locale, prefix, args) {
        let buffs = []
        let metadata = {
            //  Common & custom type
            rarityId: 1,
            typeId: 13,
            ownedByGuildId: message.guild.id,
            usable: 1
        }
        const sessionId = `SHOP_REGISTER:${message.guild.id}@${message.author.id}`
        if (await client.db.redis.exists(sessionId)) return reply.send(locale.SETSHOP.ADD_SESSION_STILL_ACTIVE)
        client.db.redis.set(sessionId, 1, `EX`, 60*3)
        //  Skip one phase ahead if user unintentionally added item name right after casting the 'add' action.
        let phaseJump = false
        let dataDisplay = null
        const secondArg = arg.split(` `)[1]
        if (secondArg) {
            phaseJump = true
            const nameLimit = 20
            if (secondArg.length >= nameLimit) return reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {socket: {limit:nameLimit}}) 
            const guildItems = await client.db.getItem(null, message.guild.id)
            if (guildItems.filter(i => i.name.toLowerCase() === secondArg.toLowerCase()).length > 0) return reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                socket: {
                    item: secondArg 
                }
            })
            metadata.name = secondArg
            dataDisplay = await message.channel.send(locale.SETSHOP.ADD_DESCRIPTION, await reply.send(`\n╰☆～**Name ::** ${secondArg}`, {raw:true}))
        }
        else {
            dataDisplay = await message.channel.send(locale.SETSHOP.ADD_NAME, await reply.send(locale.SETSHOP.ADD_NAME_FOOTER, {
                raw: true
            }))
        }
        const pool = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time:60000*3 }) // 3 minutes timeout
        let phase = phaseJump ? 1 : 0
        let completed = false
        const joinFunction = (newMessage) => {
            return reply.send(dataDisplay.embeds[0].description + newMessage, {
                footer: `Type cancel to close this registration.`,
                raw: true
            })
        }
        pool.on(`collect`, async m => {
            let input = m.content.startsWith(prefix) ? m.content.slice(prefix.length) : m.content
            if (input === `cancel`) return pool.stop()
            m.delete()
            switch(phase) {
                //  Name
                case 0:
                    const nameLimit = 20
                    if (input.length >= nameLimit) return reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {deleteIn: 5, socket: {limit:nameLimit}}) 
                    const guildItems = await client.db.getItem(null, message.guild.id)
                    if (guildItems.filter(i => i.name.toLowerCase() === input.toLowerCase()).length > 0) return reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                        deleteIn: 5,
                        socket: {
                            item: input 
                        }
                    })
                    metadata.name = input
                    //  The reason why this line doesn't use joinFunction() is to omit the 'ADD_NAME_FOOTER' string from the embed.
                    dataDisplay.edit(locale.SETSHOP.ADD_DESCRIPTION, await reply.send(`\n╰☆～**Name ::** ${input}`, {raw:true}))
                    phase++
                    break
                //  Description
                case 1:
                    const descLimit = 120
                    if (input.length >= descLimit) return reply.send(locale.SETSHOP.ADD_DESCRIPTION_OVERLIMIT, {deleteIn: 5, socket: {limit:descLimit}})
                    metadata.description = input
                    dataDisplay.edit(locale.SETSHOP.ADD_PRICE, await joinFunction(`\n╰☆～**Description ::** ${input}`))
                    phase++
                    break
                //  Price
                case 2:
                    if (!trueInt(input)) return reply.send(locale.SETSHOP.ADD_PRICE_INVALID, {deleteIn: 5})
                    metadata.price = input
                    dataDisplay.edit(locale.SETSHOP.ADD_STOCK, await joinFunction(`\n╰☆～**Price ::** ${await client.getEmoji(`artcoins`)}${commanifier(input)} @pcs`))
                    phase++
                    break
                //  Stocks
                case 3:
                    if (!trueInt(input) && (input !== `~`)) return reply.send(locale.SETSHOP.ADD_STOCK_INVALID, {deleteIn: 5})
                    metadata.stocks = input
                    dataDisplay.edit(locale.SETSHOP.ADD_TRADABILITY, await joinFunction(`\n╰☆～**Stocks ::** ${input === `~` ? `unlimited` : commanifier(input)}`))
                    phase++
                    break
                //  Tradability
                case 4:
                    if (!input.startsWith(`y`) && !input.startsWith(`n`)) return reply.send(locale.SETSHOP.ADD_TRADABILITY_INVALID, {deleteIn: 5})
                    metadata.bind = input
                    dataDisplay.edit(locale.SETSHOP.ADD_MESSAGE_UPON_USE, await joinFunction(`\n╰☆～**Can be traded ::** ${m.content.startsWith(`y`) ? `yes` : `no`}`))
                    phase++
                    break
                //  Message upon use
                case 5:
                    const messageUponUseLimit = 120
                    if (input.length >= messageUponUseLimit) return reply.send(locale.SETSHOP.ADD_MESSAGE_UPON_USE_OVERLIMIT, {deleteIn: 5})
                    metadata.responseOnUse = input
                    dataDisplay.edit(locale.SETSHOP.ADD_BUFF,
                        await joinFunction(`\n╰☆～**My response after the item is used ::** ${input === `~` ? `default` : input}`))
                    phase++
                    break
                //  Buffs upon use
                case 6:
                    if (input.startsWith(`done`)) {
                        phase = -1
                    }
                    else {
                        const params = m.content.split(` `) 
                        if (![`addrole`, `removerole`, `additem`, `removeitem`, `expboost`, `acboost`].includes(params[0])) return reply.send(locale.SETSHOP.ADD_BUFF_OUT_OF_RANGE, {deleteIn: 5})
                        //  Role update buff
                        const clientRole = message.guild.me.roles.highest
                        if ([`addrole`, `removerole`].includes(params[0])) {
                            let res = []
                            let roleNames = ``
                            const roles = params.slice(1)
                            if (!roles.length) return reply.send(locale.SETSHOP.ADD_BUFF_MISSING_ROLE, {deleteIn: 5})
                            for (let i=0; i<roles.length; i++) {
                                const ref = roles[i]
                                const role = findRole(ref, message.guild)
                                if (!role) return reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ROLE, {deleteIn: 5})
                                if (role.position >= clientRole.position) return reply.send(locale.SETSHOP.ADD_BUFF_TOO_HIGH_ROLE, {deleteIn: 5})
                                res.push(role.id)
                                roleNames += role.name + ((i+1) >= roles.length ? ` ` : `, `)
                            }
                            const isRoleAddition = params[0] ===  `addrole`
                            buffs.push({ 
                                type: isRoleAddition ? 1 : 2,
                                params: res
                            })
                            await dataDisplay.edit(locale.SETSHOP.ADD_BUFF, await joinFunction(`\n╰☆～**Bonus Effect ::** ${isRoleAddition ? `receiving` : `removed`} ${roleNames} roles`))
                        }
                        //  Inventory update buff
                        if ([`additem`, `removeitem`].includes(params[0]))  {
                            const amount = trueInt(params[1])
                            if (!amount) return reply.send(locale.SETSHOP.ADD_BUFF_INVALID_ITEM_AMOUNT, {deleteIn: 5})
                            const targetItem  = await client.db.getItem(params.slice(2).join(` `))
                            if (!targetItem) return reply.send(locale.SETSHOP.ADD_BUFF_INVALID_TARGET_ITEM, {deleteIn: 5})
                            const isItemAddition = params[0] === `additem`
                            buffs.push({
                                type: isItemAddition ? 3 : 4,
                                params: {
                                    itemId: targetItem.item_id, 
                                    amount: amount
                                }
                            })
                            await dataDisplay.edit(locale.SETSHOP.ADD_BUFF, await joinFunction(`\n╰☆～**Bonus Effect ::** ${isItemAddition ? `receiving` : `removed`} ${commanifier(amount)} pcs of '${targetItem.name}'`))
                        }
                        //  EXP/Artcoins boost buff
                        if ([`expboost`, `acboost`].includes(params[0])) {
                            const multiplier = params[1].replace(/[^0-9a-z-A-Z ]/g, ``)
                            if (!multiplier) return reply.send(locale.SETSHOP.ADD_BUFF_INVALID_MULTIPLIER, {deleteIn: 5})
                            const duration = ms(params.slice(2).join(` `))
                            if (!duration) return reply.send(locale.SETSHOP.ADD_BUFF_INVALID_DURATION, {deleteIn: 5})
                            const isExpBuff = params[0] === `expboost`
                            buffs.push({
                                type: isExpBuff ? 5 : 6,
                                params: {
                                    name: metadata.name,
                                    multiplier: multiplier/100,
                                    duration: duration
                                }
                            })
                            await dataDisplay.edit(locale.SETSHOP.ADD_BUFF, await joinFunction(`\n╰☆～**Bonus Effect ::** ${multiplier}% ${isExpBuff ? `EXP` : `Artcoins`} buff for ${ms(duration, {long:true})}`))
                        }
                        //  Limit allowed buffs per item
                        if (buffs.length >= 3) {
                            phase = -1
                        }
                        else {
                            break
                        }
                    }

                //  Finalization
                case -1:
                    const confirmation = await reply.send(dataDisplay.embeds[0].description, {
                        header: locale.SETSHOP.ADD_CONFIRMATION,
                        thumbnail: message.author.displayAvatarURL()
                    })
                    dataDisplay.delete()
                    const c = new Confirmator(client, message)
                    await c.setup(m.author.id, confirmation)
                    c.onAccept(async () => {
                        completed = true
                        pool.stop()
                        //  Register item
                        await client.db.registerItem(metadata)
                        const item = await client.db.getItem(metadata.name, message.guild.id)
                        //  Register to the shop
                        client.db.registerGuildShopItem(item.item_id, metadata.ownedByGuildId, metadata.stocks, metadata.price)
                        //  Register effect if there's any
                        if (buffs.length > 0) buffs.map(b => client.db.registerItemEffects(item.item_id, metadata.ownedByGuildId, b.type, b.params))
                        return reply.send(locale.SETSHOP.ADD_SUCCESSFUL, {
                            status: `success`,
                            socket: {
                                prefix: prefix,
                                emoji: await client.getEmoji(`789212493096026143`)
                            }
                        })      
                    })
                default:
                    break
            }
        })
        pool.on(`end`, () => {
            client.db.redis.del(sessionId)
            if (completed) return
            dataDisplay.delete()
            reply.send(`Shop register interface has been closed.`, {simplified:true})
        })
    },

    /**
     * Restock an item in the shop 
     * @return {void}
     */
     async restock(client, reply, message, arg, locale, prefix) {
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply.send(locale.SETSHOP.ALREADY_DISABLED, { socket: { prefix: prefix } })
        const activateModule = false
        if (!activateModule) return reply.send(`This setting is diabled`)

        if (!this.args[1] && !this.args[2]) return reply.send(`missing args **CHANGE STRING**`)
        const itemID = this.args[1]
        const itemExists = client.db.isValidItem(itemId, message.guild.id) 
        if (itemExists == 0) return reply.send(`Item doesnt exist please add first **CHANGE STRING**`)

        const quantity = parseInt(this.args[2])
        if (quantity < -1) quantity = -1

        const confirmation = await reply.send(`are u sure **CHANGE STRING**`/*locale.SETSHOP.CONFIRMATION_REMOVE*/, {
            image: await new GUI(message.member, client, id).build(),
            prebuffer: true
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            client.db.restockItem(itemID, quantity)
            reply.send(`restocked **CHANGE STRING**`/*locale.SETSHOP.ITEM_SUCCESSFULLY_REMOVED*/, {
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })


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

        const activateModule = true
        if (!activateModule) return reply.send(`This setting is diabled **CHANGE STRING**`)
        const itemID = this.args[1]
        const itemExists = client.db.isValidItem(itemId, message.guild.id) 
        if (itemExists == 0) return reply.send(`Item doesnt exist please add first **CHANGE STRING**`)
        const confirmation = await reply.send(`are u sure **CHANGE STRING**`/*locale.SETSHOP.CONFIRMATION_REMOVE*/, {
            image: await new GUI(message.member, client, id).build(),
            prebuffer: true
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            client.db.removeItem(itemID)
            reply.send(`removed success **CHANGE STRING**`/*locale.SETSHOP.ITEM_SUCCESSFULLY_REMOVED*/, {
                socket: {
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })

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
