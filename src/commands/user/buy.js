const stringSimilarity = require(`string-similarity`)
const Confirmator = require(`../../libs/confirmator`)
const commanifier = require(`../../utils/commanifier`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle 
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
    applicationCommand: true,
    options: [{
        name: `item`,
        description: `Item id or name you wish to buy`,
        required: true,
        type: ApplicationCommandOptionType.String
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale, prefix) {
        let guild = message.guild
        let {
            item,
            shopMetadata
        } = await this.getItem(client, guild, reply, locale, prefix, arg)
        await this.confirmOrDeny(false, message, client, locale, reply, shopMetadata, item, message.author, guild, prefix)

    },
    async Iexecute(client, reply, interaction, options, locale) {
        let arg = options.getString(`item`)
        let prefix = `/`
        let guild = interaction.guild
        let {
            item,
            shopMetadata
        } = await this.getItem(client, guild, reply, locale, prefix, arg)
        await this.confirmOrDeny(true, interaction, client, locale, reply, shopMetadata, item, interaction.member.user, guild, `/`)
    },
    async getItem(client, guild, reply, locale, prefix, arg) {
        const guildShop = await client.db.getGuildShop(guild.id)
        const availableItems = await client.db.getItem(null, guild.id)
        if (!guildShop.length || !availableItems.length) {
            await reply.send(locale.SHOP.NO_ITEMS)
            return reply.send(locale.SHOP.SETUP_TIPS, {
                simplified: true,
                socket: {
                    prefix: prefix
                }
            })
        }
        //  Handle shop closure
        if (!guild.configs.get(`SHOP_MODULE`).value) return reply.send(locale.SHOP.CLOSED)
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
            return reply.send(locale.BUY.INVALID_ITEM_TIPS, {
                simplified: true,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`AnnieHeartPeek`)
                }
            })
        }
        const shopMetadata = guildShop.find(i => i.item_id === item.item_id)
        const unlimitedSupply = shopMetadata.quantity === `~`
        //  Handle if item is out of stock
        if (!unlimitedSupply && (shopMetadata.quantity <= 0)) return reply.send(locale.BUY.OUT_OF_STOCK, {
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
                const balance = await client.db.getUserBalance(user.id, guild.id)
                //  Handle if user does not have sufficient artcoins
                if (shopMetadata.price > balance) return reply.send(locale.BUY.INSUFFICIENT_BALANCE, {
                    socket: {
                        amount: commanifier(shopMetadata.price - balance),
                        emoji: await client.getEmoji(`758720612087627787`)
                    }
                })
                //  Deduct artcoins
                client.db.updateInventory({
                    operation: `-`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: 52,
                    value: shopMetadata.price
                })
                //  Send item
                client.db.updateInventory({
                    operation: `+`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: item.item_id,
                    value: 1
                })
                //  Reduce available supply if supply wasn't set as unlimited.
                if (shopMetadata.quantity !== `~`) client.db.subtractItemSupply(item.item_id, 1)
                
                return reply.send(locale.BUY.SUCCESSFUL, {
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
                const balance = await client.db.getUserBalance(user.id, guild.id)
                //  Handle if user does not have sufficient artcoins
                if (shopMetadata.price > balance) return reply.send(locale.BUY.INSUFFICIENT_BALANCE, {
                    socket: {
                        amount: commanifier(shopMetadata.price - balance),
                        emoji: await client.getEmoji(`758720612087627787`)
                    }
                })
                //  Deduct artcoins
                client.db.updateInventory({
                    operation: `-`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: 52,
                    value: shopMetadata.price
                })
                //  Send item
                client.db.updateInventory({
                    operation: `+`,
                    userId: user.id,
                    guildId: guild.id,
                    itemId: item.item_id,
                    value: 1
                })
                //  Reduce available supply if supply wasn't set as unlimited.
                if (shopMetadata.quantity !== `~`) client.db.subtractItemSupply(item.item_id, 1)
                return reply.send(locale.BUY.SUCCESSFUL, {
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