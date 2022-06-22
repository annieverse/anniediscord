const Confirmator = require(`../../libs/confirmator`)
const loadAsset = require(`../../utils/loadAsset`)
const stringSimilarity = require(`string-similarity`)
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
        applicationCommand: false,
        /**
         * An array of the available options for welcomer module
         * @type {array}
         */
        actions: [`open`, `close`, `text`, `image`, `add`, `delete`, `edit`],
        async execute(client, reply, message, arg, locale, prefix) {
            if (!arg) return reply.send(locale.SETSHOP.GUIDE, {
                image: `banner_setshop`,
                header: `Hi, ${message.author.username}!`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`AnnieHeartPeek`)
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
            return reply.send(locale.SETSHOP.TEXT_SUCCESSFULLY_REGISTERED, {
                status: `success`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
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
            client.db.redis.set(sessionId, 1, `EX`, 60 * 3)
                //  Skip one phase ahead if user unintentionally added item name right after casting the 'add' action.
            let phaseJump = false
            let dataDisplay = null
            if (args[1]) {
                const secondArg = args.slice(1).join(` `)
                phaseJump = true
                const nameLimit = 20
                if (secondArg.length >= nameLimit) {
                    client.db.redis.del(sessionId)
                    return reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, { socket: { limit: nameLimit } })
                }
                const guildItems = await client.db.getItem(null, message.guild.id)
                if (guildItems.filter(i => i.name.toLowerCase() === secondArg.toLowerCase()).length > 0) {
                    client.db.redis.del(sessionId)
                    return reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                        socket: {
                            item: secondArg
                        }
                    })
                }
                metadata.name = secondArg
                dataDisplay = await message.channel.send(locale.SETSHOP.ADD_DESCRIPTION, await reply.send(`\n╰☆～**Name ::** ${secondArg}`, { raw: true }))
            } else {
                dataDisplay = await message.channel.send(locale.SETSHOP.ADD_NAME, await reply.send(locale.SETSHOP.ADD_NAME_FOOTER, {
                    raw: true
                }))
            }
            const pool = message.channel.createMessageCollector({filter: m => m.author.id === message.author.id, time: 60000 * 3 }) // 3 minutes timeout
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
                        switch (phase) {
                            //  Name
                            case 0:
                                const nameLimit = 20
                                if (input.length >= nameLimit) return reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, { deleteIn: 5, socket: { limit: nameLimit } })
                                const guildItems = await client.db.getItem(null, message.guild.id)
                                if (guildItems.filter(i => i.name.toLowerCase() === input.toLowerCase()).length > 0) return reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                                    deleteIn: 5,
                                    socket: {
                                        item: input
                                    }
                                })
                                metadata.name = input
                                    //  The reason why this line doesn't use joinFunction() is to omit the 'ADD_NAME_FOOTER' string from the embed.
                                dataDisplay.edit(locale.SETSHOP.ADD_DESCRIPTION, await reply.send(`\n╰☆～**Name ::** ${input}`, { raw: true }))
                                phase++
                                break
                                //  Description
                            case 1:
                                const descLimit = 120
                                if (input.length >= descLimit) return reply.send(locale.SETSHOP.ADD_DESCRIPTION_OVERLIMIT, { deleteIn: 5, socket: { limit: descLimit } })
                                metadata.description = input
                                dataDisplay.edit(locale.SETSHOP.ADD_PRICE, await joinFunction(`\n╰☆～**Description ::** ${input}`))
                                phase++
                                break
                                //  Price
                            case 2:
                                if (!trueInt(input)) return reply.send(locale.SETSHOP.ADD_PRICE_INVALID, { deleteIn: 5 })
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
     * Managing shop's image. 
     * @return {void}
     */
    async image(client, reply, message, arg, locale, prefix, args) {
        const { isValidUpload, url } = this.getImage(message, args.slice(1).join(` `))
        if (!url) return reply.send(locale.SETSHOP.IMAGE_MISSING_ATTACHMENT, {
            socket: {
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
            image: await loadAsset(id, `./src/assets/customShop`),
            prebuffer: true
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            client.db.updateGuildConfiguration({
                configCode: `SHOP_IMAGE`,
                customizedParameter: id,
                guild: message.guild,
                setByUserId: message.author.id,
                cacheTo: message.guild.configs
            })
            reply.send(locale.SETSHOP.IMAGE_SUCCESSFULLY_APPLIED, {
                status: `success`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`789212493096026143`)
                }
            })
        })
    },

    /** 
     * Check if user has attempted to upload a custom image
     * @param {Message} message Current message instance
     * @param {string} src Source keyword for parsing image url/attachment
     * @return {object}
     */
    getImage(message, src) {
        const hasAttachment = message.attachments.first() ? true : false
        const hasImageURL = src.startsWith(`http`) && src.length >= 15 ? true : false
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: message.attachments.first() ?
                message.attachments.first().url : src.startsWith(`http`) && src.length >= 15 ?
                src : null
        }
    },

    /**
     * Delete an item from shop and server.
     * @return {void}
     */
    async delete(client, reply, message, arg, locale, prefix, args) {
        const guildItems = await client.db.getItem(null, message.guild.id)
        if (!guildItems.length) return reply.send(locale.SETSHOP.DELETE_EMPTY_ITEMS)
        const keyword = args.slice(1).join(` `)
        if (!keyword) return reply.send(locale.SETSHOP.DELETE_MISSING_TARGET, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(keyword, guildItems.map(i => i.name.toLowerCase()))
		const item = searchStringResult.bestMatch.rating >= 0.5
        //  By name
        ? guildItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target) 
        //  Fallback search by ID
        : guildItems.find(i => parseInt(i.item_id) === parseInt(keyword))
        if (!item) return reply.send(locale.SETSHOP.ITEM_DOESNT_EXISTS, {socket:{item: keyword}})
        const confirmation = await reply.send(locale.SETSHOP.DELETE_CONFIRMATION, {
            header: `Delete '${item.name}'?`,
            thumbnail: message.author.displayAvatarURL(),
            socket: {
                item: item.name
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            client.db.removeGuildShopItem(item.item_id)
            reply.send(locale.SETSHOP.DELETE_SUCCESSFUL, {
                socket: {
                    item: item.name
                }
            })
        })
    },

    /**
     * Edit item's metadata.
     * @return {void}
     */
    async edit(client, reply, message, arg, locale, prefix, args) {
        const guildItems = await client.db.getItem(null, message.guild.id)
        if (!guildItems.length) return reply.send(locale.SETSHOP.DELETE_EMPTY_ITEMS)
        const keyword = args.slice(1).join(` `)
        if (!keyword) return reply.send(locale.SETSHOP.DELETE_MISSING_TARGET, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(keyword, guildItems.map(i => i.name.toLowerCase()))
		const item = searchStringResult.bestMatch.rating >= 0.5
        //  By name
        ? guildItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target) 
        //  Fallback search by ID
        : guildItems.find(i => parseInt(i.item_id) === parseInt(keyword))
        if (!item) return reply.send(locale.SETSHOP.ITEM_DOESNT_EXISTS, {socket:{item: keyword}})
        const guide = await reply.send(locale.SETSHOP.EDIT_GUIDE, {
            simplified: true,
            socket: {
                item: item.name,
                emoji: await client.getEmoji(`AnnieHeartPeek`),
                prefix: prefix
            }
        })
        const pool = message.channel.createMessageCollector({filter: m => m.author.id === message.author.id, time:60000*3 }) // 3 minutes timeout
        let completed = false
        pool.on(`collect`, async m => {
            let input = m.content.startsWith(prefix) ? m.content.slice(prefix.length) : m.content
            if (input === `cancel`) return pool.stop()
            const argsPool = input.split(` `)
            const action = argsPool[0]
            const params = argsPool.slice(1).join(` `) 
            const guildItems = await client.db.getItem(null, message.guild.id)
            switch(action) {
                //  Changing item name
                case `name`:
                    m.delete()
                    const nameLimit = 20
                    if (params.length >= nameLimit) return reply.send(locale.SETSHOP.ADD_NAME_OVERLIMIT, {deleteIn: 5, socket: {limit:nameLimit}}) 
                    if (guildItems.filter(i => i.name.toLowerCase() === params.toLowerCase()).length > 0) return reply.send(locale.SETSHOP.ADD_NAME_DUPLICATE, {
                        deleteIn: 5,
                        socket: {
                            item: params 
                        }
                    })
                    client.db.updateItemMetadata(item.item_id, `name`, params)
                    reply.send(locale.SETSHOP.EDIT_NAME_SUCCESSFUL, {
                        socket: {
                            oldItem: item.name,
                            newItem: params
                        }
                    })
                    break
                //  Changing item's description
                case `description`:
                    m.delete()
                    const descLimit = 120
                    if (params.length >= descLimit) return reply.send(locale.SETSHOP.ADD_DESCRIPTION_OVERLIMIT, {deleteIn: 5, socket: {limit:descLimit}})
                    client.db.updateItemMetadata(item.item_id, `description`, params)
                    reply.send(locale.SETSHOP.EDIT_DESC_SUCCESSFUL, {
                        socket: {
                           item: item.name
                        }
                    })
                    break
                //  Changing item's price
                case `price`:
                    m.delete()
                    const priceLimit = 999999999999999
                    if (parseInt(params) >= priceLimit) return reply.send(locale.SETSHOP.EDIT_PRICE_OVERLIMIT, {deleteIn: 5, socket: {limit:commanifier(priceLimit)}})
                    if (!trueInt(params)) return reply.send(locale.SETSHOP.EDIT_PRICE_INVALID, {deleteIn: 5})
                    client.db.updateShopItemMetadata(item.item_id, `price`, parseInt(params))
                    reply.send(locale.SETSHOP.EDIT_PRICE_SUCCESSFUL, {
                        socket: {
                           item: item.name
                        }
                    })
                    break
                //  Updating item's stocks
                case `stock`:
                    m.delete()
                    const stockLimit = 999999999999999
                    const setAsUnlimited = params === `~`
                    if (!setAsUnlimited) {
                        if (parseInt(params) >= stockLimit) return reply.send(locale.SETSHOP.EDIT_STOCK_OVERLIMIT, {deleteIn: 5, socket: {limit:commanifier(stockLimit)}})
                        if (!trueInt(params)) return reply.send(locale.SETSHOP.EDIT_PRICE_INVALID, {deleteIn: 5})
                    }
                    client.db.updateShopItemMetadata(item.item_id, `quantity`, params)
                    reply.send(locale.SETSHOP.EDIT_STOCK_SUCCESSFUL, {
                        socket: {
                           item: item.name
                        }
                    })
                    break
                //  Updating Annie's response upon use of the item.
                case `response`: 
                    m.delete()
                    const messageUponUseLimit = 120
                    if (params.length >= messageUponUseLimit) return reply.send(locale.SETSHOP.EDIT_MSGUPONUSE_OVERLIMIT, {deleteIn: 5, socket: {limit:messageUponUseLimit}})
                    client.db.updateItemMetadata(item.item_id, `response_on_use`, params)
                    reply.send(locale.SETSHOP.EDIT_MSGUPONUSE_SUCCESSFUL, {
                        socket: {
                            item: item.name
                        }
                    })
                    break
                //  Finalize
                case `done`: 
                    m.delete()
                    completed = true
                    pool.stop()
            }
        })
        pool.on(`end`, () => {
            guide.delete()
            if (completed) return
            return reply.send(locale.SETSHOP.EDIT_TIMEOUT, {
                socket: {
                    item: item.name
                }
            })
        })
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