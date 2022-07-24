const Confirmator = require(`../../libs/confirmator`)
const User = require(`../../libs/user`)
const inventoryGUI = require(`../../ui/prebuild/inventory`)
const giftGUI = require(`../../ui/prebuild/gift`)
const stringSimilarity = require(`string-similarity`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Send gifts to your friends! They will receive 1 reputation point for each gift you send.
     * @author klerikdust
     */
module.exports = {
    name: `gift`,
    aliases: [`gifts`, `giveitem`, `senditem`, `praise`],
    description: `Send gifts to your friends! They will receive 1 reputation point for each gift you send.`,
    usage: `gift <User>`,
    permissionLevel: 0,
    applicationCommand: false,
    type: ApplicationCommandType.ChatInput,
    /**
     *  Prettify result from `this.author.inventory.row` into a readable list.
     *  @param {array} [inventory=[]] returned result from filtered `this.author.inventory.raw`
     *  @param {Client} client Current bot/client instance.
     *  @retuns {string}
     */
    async displayGifts(inventory = [], client) {
        let str = ``
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i]
            str += `• ${await client.getEmoji(item.alias)} ${commanifier(item.quantity)}x ${item.name}`
            if (i != (inventory.length - 1)) str += `\n`
        }
        return str
    },
    async execute(client, reply, message, arg, locale) {
        const itemFilter = item => (item.type_id === 10) && (item.quantity > 0)
        const userLib = new User(client, message)
        let userData = await userLib.requestMetadata(message.author, 2)
        const availableGifts = userData.inventory.raw.filter(itemFilter)
            //  Handle if user don't have any gifts to send
        if (!availableGifts.length) return reply.send(locale.GIFT.UNAVAILABLE, {
            socket: {
                prefix: client.prefix,
                emoji: await client.getEmoji(`692428927620087850`)
            }
        })
        userData.inventory.raw = availableGifts
            // Handle if user doesn't specify anything
        if (!arg) {
            const loading = await reply.send(locale.GIFT.RENDERING_AVAILABLE_GIFTS, { simplified: true, socket: { emoji: await client.getEmoji(`790994076257353779`) } })
            await reply.send(locale.GIFT.SHORT_GUIDE, {
                prebuffer: true,
                image: (await new inventoryGUI(userData, client).build()).toBuffer(),
                socket: {
                    prefix: client.prefix,
                    referenceItem: availableGifts[0].name.toLowerCase(),
                    items: await this.displayGifts(availableGifts, client)
                }
            })
            return loading.delete()
        }
        const targetUser = await userLib.lookFor(arg)
            // Invalid target
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            // Returns if user trying to gift themselves.
        if (userLib.isSelf(targetUser.id)) return reply.send(locale.GIFT.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`790338393015713812`) } })
            //  Handle if the specified gift cannot be found
        arg = arg.replace(targetUser.usedKeyword + ` `, ``) // Trim additional whitespace
        let searchStringResult = stringSimilarity.findBestMatch(arg, availableGifts.map(i => i.name))
        const gift = searchStringResult.bestMatch.rating >= 0.2 ? availableGifts.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!gift) return reply.send(locale.GIFT.MISSING_ITEM, {
                socket: { example: `e.g. **\`${client.prefix}gift ${targetUser.master.username} 10 ${availableGifts[0].name.toLowerCase()}\`**` }
            })
            //  Handle if can't parse the desired user's gift amount
        const amount = arg.replace(/\D/g, ``)
        if (!amount) return reply.send(locale.GIFT.INVALID_AMOUNT, {
                socket: {
                    gift: gift.name,
                    example: `e.g. **\`${client.prefix}gift ${targetUser.master.username} 10 ${gift.name.toLowerCase()}\`**`
                }
            })
            //  Render confirmation
        const targetUserData = await userLib.requestMetadata(targetUser.master, 2)
        const confirmation = await reply.send(locale.GIFT.CONFIRMATION, {
            prebuffer: true,
            image: await new giftGUI(targetUserData, gift, amount).build(),
            socket: {
                user: targetUser.master.username,
                gift: `${await client.getEmoji(gift.alias)} ${gift.name}`,
                amount: commanifier(amount)
            }
        })
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async() => {
            //  Handle if the amount to send is lower than total owned item
            if (gift.quantity < amount) return reply.send(locale.GIFT.INSUFFICIENT_AMOUNT, {
                    socket: {
                        gift: `${await client.getEmoji(gift.alias)} ${commanifier(gift.quantity)}x ${gift.name}`,
                        emoji: await client.getEmoji(`692428613122785281`)
                    }
                })
                //  Adds reputation point to target user
            client.db.updateUserReputation(amount, targetUser.master.id, message.author.id, message.guild.id)
                //  Deduct gifts from sender
            client.db.updateInventory({ itemId: gift.item_id, value: amount, operation: `-`, userId: message.author.id, guildId: message.guild.id })
            return reply.send(``, {
                customHeader: [`${targetUser.master.username} has received your gifts!♡`, targetUser.master.displayAvatarURL()],
                socket: {
                    user: targetUser.master.username,
                    gift: `${await client.getEmoji(gift.alias)} ${commanifier(amount)}x ${gift.name}!`
                }
            })
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {}
}