const GUI = require(`../../ui/prebuild/inventory`)
const Command = require(`../../libs/commands`)
/**
 * Views all items in your inventory
 * @author klerikdust
 */
class Inventory extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		this.ignoreItems = [`Cards`, `Themes`]
		this.itemsFilter = item => (item.quantity > 0) && (item.in_use === 0) && !this.ignoreItems.includes(item.type_name)
	}

	/**
	 * Running command workflow
	 * @return {void}
	 */
	async execute() {
		await this.requestUserMetadata(2)
		//  Handle if couldn't find the invntory's author
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		//  Handle if couldn't fetch the inventory
		const INVALID_INVENTORY = this.user.master.id === this.message.author.id ? this.locale.INVENTORY.AUTHOR_EMPTY : this.locale.INVENTORY.OTHER_USER_EMPTY
		if (this.user.inventory.raw.length <= 0) return this.reply (INVALID_INVENTORY, {socket: {user: this.user.master.username} })
		this.reply(this.locale.COMMAND.FETCHING, {simplified: true, socket: {command: `inventory`, user: this.user.master.id, emoji: await this.bot.getEmoji(`790994076257353779`)}})
		.then(async loading => {
			//  Remove faulty values and sort order by rarity
			const filteredInventory = this.user.inventory.raw.filter(this.itemsFilter).sort((a,b) => a.rarity_id - b.rarity_id).reverse()
			this.user.inventory.raw = filteredInventory
			await this.reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: (await new GUI(this.user, this.bot).build()).toBuffer(),
				socket: {
					user: this.user.master.username,
					emoji: await this.bot.getEmoji(`700731914801250324`),
					command: `Items Inventory`
				}
			})
			return loading.delete()
		})
	}
}

module.exports.help = {
	start: Inventory,
	name: `inventory`,
	aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`],
	description: `Views all items in user's inventory`,
	usage: `inventory <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}
