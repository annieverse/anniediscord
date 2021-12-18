const stringSimilarity = require(`string-similarity`)
const Confirmator = require(`../../libs/confirmator`)
const commanifier = require(`../../utils/commanifier`)
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
    async execute(client, reply, message, arg, locale, prefix) {
        const guildShop = await client.db.getGuildShop(message.guild.id)
        const availableItems = await client.db.getItem(null, message.guild.id)
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
        if (!message.guild.configs.get(`SHOP_MODULE`).value) return reply.send(locale.SHOP.CLOSED)
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
        const confirmation = await reply.send(locale.BUY.CONFIRMATION, {
            thumbnail: message.author.displayAvatarURL(),
            socket: {
                emoji: await client.getEmoji(`758720612087627787`),
                price: commanifier(shopMetadata.price),
                item: item.name
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            const balance = await client.db.getUserBalance(message.author.id, message.guild.id)
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
                userId: message.author.id,
                guildId: message.guild.id,
                itemId: 52,
                value: shopMetadata.price
            })
            //  Send item
            client.db.updateInventory({
                operation: `+`,
                userId: message.author.id,
                guildId: message.guild.id,
                itemId: item.item_id,
                value: 1
            })
            //  Reduce available supply if supply wasn't set as unlimited.
            if (shopMetadata.quantity !== `~`) client.db.subtractItemSupply(item.item_id, 1)
            return reply.send(locale.BUY.SUCCESSFUL, {
                status: `success`,
                socket: {
                    user: message.author.username,
                    item: item.name,
                    prefix: prefix
                }
            })
        })
    }
}