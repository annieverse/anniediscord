const GUI = require(`../../ui/prebuild/ownerHeader`)
const commanifier = require(`../../utils/commanifier`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Views all items in your inventory
     * @author klerikdust
     */
module.exports = {
        name: `inventory`,
        aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`],
        description: `Views all items in user's inventory`,
        usage: `inventory <User>(Optional)`,
        permissionLevel: 0,
        applicationCommand: true,
        messageCommand: true,
        options: [{
            name: `user`,
            description: `User you wish to view inventory of`,
            required: false,
            type: ApplicationCommandOptionType.User
        }],
        ignoreItems: [`Cards`, `Themes`],
        type: ApplicationCommandType.ChatInput,
        async execute(client, reply, message, arg, locale, prefix) {
            const itemsFilter = item => (item.quantity > 0) && (item.in_use === 0) && !this.ignoreItems.includes(item.type_name)
            const userLib = new User(client, message)
            let targetUser = arg ? await userLib.lookFor(arg) : message.author
            if (!targetUser) return reply.send(locale.USER.IS_INVALID)
                //  Normalize structure
            targetUser = targetUser.master || targetUser
            let targetUserData = await userLib.requestMetadata(targetUser, 2)
                //  Handle if couldn't fetch the inventory
            const INVALID_INVENTORY = userLib.isSelf(targetUser.id) ? locale.INVENTORY.AUTHOR_EMPTY : locale.INVENTORY.OTHER_USER_EMPTY
            if (targetUserData.inventory.raw.length <= 0) return reply.send(INVALID_INVENTORY, { socket: { user: targetUser.username } })
            reply.send(locale.INVENTORY.FETCHING, { socket: { emoji: await client.getEmoji(`AAUloading`) } })
                .then(async loading => {
                        //  Remove faulty values and sort order by rarity
                        const filteredInventory = targetUserData.inventory.raw.filter(itemsFilter).sort((a, b) => a.rarity_id - b.rarity_id).reverse()
                        targetUserData.inventory.raw = filteredInventory
                        let res = []
                        let str = ``
                        let breakpoint = 0
                        const limitPerPage = 3
                        for (let i = 0; i < filteredInventory.length; i++) {
                            const item = filteredInventory[i]
                            if (breakpoint < 1) {
                                str += `╭*:;,．★ ～☆*───────╮\n`
                            }
                            breakpoint++
                            str += `╰☆～(ID:${item.item_id}) ${commanifier(item.quantity)}x **${item.name}**\n> Rarity/type:: ${item.rarity_name}, ${item.type_name}\n> Description:: ${item.description}\n> ${item.usable ? `__Consumable__` : `__Cannot be used__`}\n\n`
                if (breakpoint >= limitPerPage || i === (filteredInventory.length-1)) {
                    str = str.substring(0, str.length - 1)
                    str += `╰────────☆～*:;,．*╯`
                    breakpoint = 0
                    res.push(str)
                    str = ``
                }
            }
			await reply.send(res, {
                prebuffer: true,
                image: await new GUI(targetUserData).build(),
                paging: true,
                customHeader: [`${targetUser.username}'s Inventory!`, targetUser.displayAvatarURL()],
			})
            if (userLib.isSelf(targetUser.id)) reply.send(locale.INVENTORY.AUTHOR_TIPS, {
                simplified: true,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`848521358236319796`)
                }
            })
			return loading.delete()
		})
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const itemsFilter = item => (item.quantity > 0) && (item.in_use === 0) && !this.ignoreItems.includes(item.type_name)
            const userLib = new User(client, interaction)
            let targetUser = options.getUser(`user`) || interaction.member.user
            if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            let targetUserData = await userLib.requestMetadata(targetUser, 2)
                //  Handle if couldn't fetch the inventory
            const INVALID_INVENTORY = userLib.isSelf(targetUser.id) ? locale.INVENTORY.AUTHOR_EMPTY : locale.INVENTORY.OTHER_USER_EMPTY
            if (targetUserData.inventory.raw.length <= 0) return reply.send(INVALID_INVENTORY, { socket: { user: targetUser.username } })
            reply.send(locale.INVENTORY.FETCHING, { socket: { emoji: await client.getEmoji(`AAUloading`) } })
                .then(async loading => {
                        //  Remove faulty values and sort order by rarity
                        const filteredInventory = targetUserData.inventory.raw.filter(itemsFilter).sort((a, b) => a.rarity_id - b.rarity_id).reverse()
                        targetUserData.inventory.raw = filteredInventory
                        let res = []
                        let str = ``
                        let breakpoint = 0
                        const limitPerPage = 3
                        for (let i = 0; i < filteredInventory.length; i++) {
                            const item = filteredInventory[i]
                            if (breakpoint < 1) {
                                str += `╭*:;,．★ ～☆*───────╮\n`
                            }
                            breakpoint++
                            str += `╰☆～(ID:${item.item_id}) ${commanifier(item.quantity)}x **${item.name}**\n> Rarity/type:: ${item.rarity_name}, ${item.type_name}\n> Description:: ${item.description}\n> ${item.usable ? `__Consumable__` : `__Cannot be used__`}\n\n`
                if (breakpoint >= limitPerPage || i === (filteredInventory.length-1)) {
                    str = str.substring(0, str.length - 1)
                    str += `╰────────☆～*:;,．*╯`
                    breakpoint = 0
                    res.push(str)
                    str = ``
                }
            }
			await reply.send(res, {
                prebuffer: true,
                image: await new GUI(targetUserData).build(),
                paging: true,
                customHeader: [`${targetUser.username}'s Inventory!`, targetUser.displayAvatarURL()],
                followUp: true
			})
            if (userLib.isSelf(targetUser.id)) reply.send(locale.INVENTORY.AUTHOR_TIPS, {
                simplified: true,
                socket: {
                    prefix: `/`,
                    emoji: await client.getEmoji(`848521358236319796`)
                },
                followUp: true
            })
			return loading.delete()
		})
    }
}