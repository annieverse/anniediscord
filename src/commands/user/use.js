const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const ItemEffects = require(`../../libs/itemEffects`)
const stringSimilarity = require(`string-similarity`)
/**
 * Consume an item and gain pre-defined effect.
 * @author klerikdust
 */
module.exports = {
    name: `use`,
	aliases: [`use`, `uses`],
	description: `Consume an item and gain pre-defined effect`,
	usage: `use <item>`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
        const data = await (new User(client, message)).requestMetadata(message.author, 2)
        if (!data.inventory.raw.length) return reply.send(locale.USE.NO_ITEMS, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        //  Finding the closest target item.
		const searchStringResult = stringSimilarity.findBestMatch(arg, data.inventory.raw.map(i => i.name))
		const targetItem = searchStringResult.bestMatch.rating >= 0.5 
        ? data.inventory.raw.filter(i => i.name === searchStringResult.bestMatch.target)[0] 
        : null
        if (!targetItem) return reply.send(locale.USE.INVALID_ITEM, {
            socket: {
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        })
        //  Usage confirmation
        const confirmation = await reply.send(locale.USE.CONFIRMATION, {
            socket: {
                item: targetItem.name
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            //  Deduct item from user's inventory.
            client.db.updateInventory({
                itemId: targetItem.item_id,
                userId: message.author.id,
                guildId: message.guild.id,
                operation: `-`,
                value: 1
            })
            //  Applying effect if there's any.
            const itemEffects = await client.db.getItemEffects(targetItem.item_id)
            if (itemEffects.length > 0) {
                const effectLib = new ItemEffects(client, message)
                for (let i=0; i<itemEffects.length; i++) {
                    const e = itemEffects[i]
                    await effectLib[effectLib.buffReferences[e.effect_red_id]](JSON.parse(e.param))
                }
            }
            //  Displaying custom message upon use (if there's any).
            const displayedMsg = targetItem.response_on_use || locale.USE.SUCCESSFUL
            return reply.send(displayedMsg, {
                socket: {
                    item: targetItem.name,
                    user: message.author.username
                }
            })
        })
    }
}
