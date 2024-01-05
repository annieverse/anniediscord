"use strict"
const stringSimilarity = require(`string-similarity`)
const Confirmator = require(`../../libs/confirmator`)
const commanifier = require(`../../utils/commanifier`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Buy any purchasable items from server shop!
 * @author klerikdust
 */
module.exports = {
    name: `buy`,
    aliases: [`purchase`, `buyy`],
    description: `Buy any purchasable items from server shop!`,
    usage: `buy <ItemID/ItemName>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `item`,
        description: `Item id or name you wish to buy`,
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        return await this.run(client, reply, message, arg, locale, prefix)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        let arg = options.getString(`item`)
        let prefix = `/`
        return await this.run(client, reply, interaction, arg, locale, prefix)
    },
    async run(client, reply, messageRef, arg, locale, prefix) {
        let {
            item,
            shopMetadata
        } = await this.getItem(client, messageRef.guild, reply, locale, prefix, arg)
        if (!item) return
        return await this.confirmOrDeny(false, messageRef, client, locale, reply, shopMetadata, item, messageRef.member, messageRef.guild, prefix)
    },
    async getItem(client, guild, reply, locale, prefix, arg) {
        const guildShop = await client.db.shop.getGuildShop(guild.id)
        const availableItems = await client.db.shop.getItem(null, guild.id)
        if (!guildShop.length || !availableItems.length) {
            await reply.send(locale.SHOP.NO_ITEMS)
            return await reply.send(locale.SHOP.SETUP_TIPS, {
                simplified: true,
                socket: {
                    prefix: prefix
                },
                followUp: true
            })
        }
        //  Handle shop closure
        if (!guild.configs.get(`SHOP_MODULE`).value) return await reply.send(locale.SHOP.CLOSED)
        //  Find best match
        const searchStringResult = stringSimilarity.findBestMatch(arg, availableItems.map(i => i.name.toLowerCase()))
        const item = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            availableItems.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            availableItems.find(i => parseInt(i.item_id) === parseInt(arg))
        if (!item) {
            await reply.send(locale.BUY.INVALID_ITEM)
            return await reply.send(locale.BUY.INVALID_ITEM_TIPS, {
                simplified: true,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`AnnieHeartPeek`)
                },
                followUp: true
            })
        }
        const shopMetadata = guildShop.find(i => i.item_id === item.item_id)
        const unlimitedSupply = shopMetadata.quantity === `~` || shopMetadata.quantity === 9223372036854775807n
        //  Handle if item is out of stock
        if (!unlimitedSupply && (shopMetadata.quantity <= 0)) return await reply.send(locale.BUY.OUT_OF_STOCK, {
            socket: {
                item: item.name,
                emoji: await client.getEmoji(`692428908540461137`)
            }
        })
        return {
            item,
            shopMetadata
        }
    },
    async confirmOrDeny(slashCommand, message, client, locale, reply, shopMetadata, item, user, guild, prefix) {

        if (slashCommand) {
            const confirmation = await reply.send(locale.BUY.CONFIRMATION, {
                thumbnail: user.displayAvatarURL(),
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    price: commanifier(shopMetadata.price),
                    item: item.name
                }
            })
            const c = new Confirmator(message, reply, true)
            await c.setup(user.id, confirmation)
            c.onAccept(async () => {
                await message.fetchReply()
                const balance = await client.db.userUtils.getUserBalance(user.id, guild.id)
                //  Handle if user does not have sufficient artcoins
                if (shopMetadata.price > balance) return await reply.send(locale.BUY.INSUFFICIENT_BALANCE, {
                    socket: {
                        amount: commanifier(shopMetadata.price - balance),
                        emoji: await client.getEmoji(`758720612087627787`)
                    },
                    followUp: true
                })
                //  Deduct artcoins
                client.db.databaseUtils.updateInventory({
                    operation: `-`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: 52,
                    value: shopMetadata.price
                })
                //  Send item
                client.db.databaseUtils.updateInventory({
                    operation: `+`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: item.item_id,
                    value: 1
                })
                //  Reduce available supply if supply wasn't set as unlimited.
                const unlimitedSupply = shopMetadata.quantity != `~` && shopMetadata.quantity != 9223372036854775807n
                if (unlimitedSupply) client.db.shop.subtractItemSupply(item.item_id, 1)

                return await reply.send(locale.BUY.SUCCESSFUL, {
                    status: `success`,
                    socket: {
                        user: user.username,
                        item: item.name,
                        prefix: prefix
                    },
                    followUp: true
                })
            })
        } else {
            const confirmation = await reply.send(locale.BUY.CONFIRMATION, {
                thumbnail: user.displayAvatarURL(),
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    price: commanifier(shopMetadata.price),
                    item: item.name
                }
            })
            const c = new Confirmator(message, reply, false)
            await c.setup(user.id, confirmation)
            c.onAccept(async () => {
                const balance = await client.db.userUtils.getUserBalance(user.id, guild.id)
                //  Handle if user does not have sufficient artcoins
                if (shopMetadata.price > balance) return await reply.send(locale.BUY.INSUFFICIENT_BALANCE, {
                    socket: {
                        amount: commanifier(shopMetadata.price - balance),
                        emoji: await client.getEmoji(`758720612087627787`)
                    }
                })
                //  Deduct artcoins
                client.db.databaseUtils.updateInventory({
                    operation: `-`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: 52,
                    value: shopMetadata.price
                })
                //  Send item
                client.db.databaseUtils.updateInventory({
                    operation: `+`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: item.item_id,
                    value: 1
                })
                //  Reduce available supply if supply wasn't set as unlimited.
                if (shopMetadata.quantity !== `~`) client.db.shop.subtractItemSupply(item.item_id, 1)
                return await reply.send(locale.BUY.SUCCESSFUL, {
                    status: `success`,
                    socket: {
                        user: user.username,
                        item: item.name,
                        prefix: prefix
                    }
                })
            })
        }
    }
}