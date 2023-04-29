const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const ItemEffects = require(`../../libs/itemEffects`)
const stringSimilarity = require(`string-similarity`)
const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Consume an item and gain certain effect.
 * @author klerikdust
 */
module.exports = {
    name: `use`,
    aliases: [`use`, `uses`, `eat`, `drink`, `open`, `consume`],
    description: `Consume an item and gain certain effect`,
    usage: `use <item>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `item`,
        description: `The item you want to use`,
        required: true,
        type: ApplicationCommandOptionType.String,
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const data = await (new User(client, message)).requestMetadata(message.author, 2)
        if (!data.inventory.raw.length) return await reply.send(locale.USE.NO_ITEMS, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        //  Finding the closest target item.
        const searchStringResult = stringSimilarity.findBestMatch(arg.toLowerCase(), data.inventory.raw.map(i => i.name.toLowerCase()))
        const targetItem = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            data.inventory.raw.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            data.inventory.raw.find(i => parseInt(i.item_id) === parseInt(arg))
        if (!targetItem) return await reply.send(locale.USE.INVALID_ITEM, {
            socket: {
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        })
        if (targetItem.quantity <= 0) return await reply.send(locale.USE.INSUFFICIENT)
        //  Handle non-usable item
        if (targetItem.usable === 0) return await reply.send(locale.USE.UNUSABLE, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        const effectLib = new ItemEffects(client, message)
        //  Usage confirmation
        const confirmation = await reply.send(locale.USE.CONFIRMATION, {
            thumbnail: message.author.displayAvatarURL(),
            socket: {
                item: targetItem.name,
                footer: await effectLib.displayItemBuffs(targetItem.item_id) || locale.USE.CONFIRMATION_TIPS
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            //  Deduct item from user's inventory.
            client.db.databaseUtils.updateInventory({
                itemId: targetItem.item_id,
                userId: message.author.id,
                guildId: message.guild.id,
                operation: `-`,
                value: 1
            })
            //  Applying effect if there's any.
            effectLib.applyItemEffects(targetItem.item_id)
            //  Displaying custom message upon use (if there's any).
            const displayedMsg = targetItem.response_on_use === `~` ? locale.USE.SUCCESSFUL : targetItem.response_on_use
            return await reply.send(displayedMsg, {
                status: `success`,
                socket: {
                    item: `**${targetItem.name}**`,
                    user: `**${message.author.username}**`
                }
            })
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const data = await (new User(client, interaction)).requestMetadata(interaction.member.user, 2)
        if (!data.inventory.raw.length) return await reply.send(locale.USE.NO_ITEMS, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        //  Finding the closest target item.
        let arg = options.getString(`item`)
        const searchStringResult = stringSimilarity.findBestMatch(arg.toLowerCase(), data.inventory.raw.map(i => i.name.toLowerCase()))
        const targetItem = searchStringResult.bestMatch.rating >= 0.5
            //  By name
            ?
            data.inventory.raw.find(i => i.name.toLowerCase() === searchStringResult.bestMatch.target)
            //  Fallback search by ID
            :
            data.inventory.raw.find(i => parseInt(i.item_id) === parseInt(arg))
        if (!targetItem) return await reply.send(locale.USE.INVALID_ITEM, {
            socket: {
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        })
        if (targetItem.quantity <= 0) return await reply.send(locale.USE.INSUFFICIENT)
        //  Handle non-usable item
        if (targetItem.usable === 0) return await reply.send(locale.USE.UNUSABLE, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`)
            }
        })
        const effectLib = new ItemEffects(client, interaction)
        //  Usage confirmation
        const confirmation = await reply.send(locale.USE.CONFIRMATION, {
            thumbnail: interaction.member.displayAvatarURL(),
            socket: {
                item: targetItem.name,
                footer: await effectLib.displayItemBuffs(targetItem.item_id) || locale.USE.CONFIRMATION_TIPS
            }
        })
        const c = new Confirmator(interaction, reply, true)
        await c.setup(interaction.member.id, confirmation)
        c.onAccept(async () => {
            //  Deduct item from user's inventory.
            client.db.databaseUtils.updateInventory({
                itemId: targetItem.item_id,
                userId: interaction.member.id,
                guildId: interaction.guild.id,
                operation: `-`,
                value: 1
            })
            //  Applying effect if there's any.
            effectLib.applyItemEffects(targetItem.item_id)
            //  Displaying custom message upon use (if there's any).
            const displayedMsg = targetItem.response_on_use === `~` ? locale.USE.SUCCESSFUL : targetItem.response_on_use
            return await reply.send(displayedMsg, {
                status: `success`,
                socket: {
                    item: `**${targetItem.name}**`,
                    user: `**${interaction.member.user.username}**`
                },
                followUp: true
            })
        })
    }
}