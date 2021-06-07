const GUI = require(`../../ui/prebuild/inventory`)
const User = require(`../../libs/user`)
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
    ignoreItems: [`Cards`, `Themes`],
    async execute(client, reply, message, arg, locale) {
		const itemsFilter = item => (item.quantity > 0) && (item.in_use === 0) && !this.ignoreItems.includes(item.type_name)
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        let targetUserData = await userLib.requestMetadata(targetUser, 2)
		//  Handle if couldn't fetch the inventory
		const INVALID_INVENTORY = userLib.isSelf(targetUser.id) ? locale.INVENTORY.AUTHOR_EMPTY : locale.INVENTORY.OTHER_USER_EMPTY
		if (targetUserData.inventory.raw.length <= 0) return reply.send(INVALID_INVENTORY, {socket: {user: targetUser.username} })
		reply.send(locale.COMMAND.FETCHING, {simplified: true, socket: {command: `inventory`, user: message.author.id, emoji: await client.getEmoji(`790994076257353779`)}})
		.then(async loading => {
			//  Remove faulty values and sort order by rarity
			const filteredInventory = targetUserData.inventory.raw.filter(itemsFilter).sort((a,b) => a.rarity_id - b.rarity_id).reverse()
			targetUserData.inventory.raw = filteredInventory
			await reply.send(locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: (await new GUI(targetUserData, client).build()).toBuffer(),
				socket: {
					user: targetUser.username,
					emoji: await client.getEmoji(`700731914801250324`),
					command: `Items Inventory`
				}
			})
			return loading.delete()
		})
    }
}
