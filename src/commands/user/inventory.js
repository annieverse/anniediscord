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
		this.itemsFilter = item => (item.quantity != false) && (item.in_use === 0) && (item.type != `CARDS`)
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, name, emoji, commanifier, bot:{locale:{INVENTORY}} }) {
		await this.requestUserMetadata(2)

		//  Handle if couldn't find the invntory's author
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		//  Handle if couldn't fetch the inventory
		const INVALID_INVENTORY = this.user.isSelf ? this.locale.INVENTORY.AUTHOR_EMPTY : this.locale.INVENTORY.OTHER_USER_EMPTY
		if (!this.user.inventory) return reply (INVALID_INVENTORY, {color: `red`, socket: {user: name(this.user.id)} })
		reply(this.locale.COMMAND.FETCHING, {simplified: true, socket: {command: `inventory`, user: this.user.id, emoji: emoji(`AAUloading`)}})
		.then(async loading => {
			//  Remove faulty values and sort order by type descendantly
			const filteredInventory = this.user.inventory.raw.filter(this.itemsFilter).sort((a,b) => a.quantity - b.quantity).reverse()
			await reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: await GUI(filteredInventory, this.user.usedTheme),
				socket: {
					user: name(this.user.id),
					emoji: emoji(`AnniePogg`),
					command: `Items Inventory`
				}
			})
			loading.delete()
			return reply(this.displayDetailedInventory(filteredInventory, commanifier), {simplified: true})
		})
	}

	/**
	 * 	Prettify result from `this.user.inventory.raw`
	 * 	@param {array} [inventory=[]] user's raw inventory metadata
	 *  @param {function} [numberParser] supply with `Pistachio.commanifier()``
	 *  @returns {string}
	 */
	displayDetailedInventory(inventory=[], numberParser) {
		let str = `\`\`\`\n`
		for (let i=0; i<inventory.length; i++) {
			const item = inventory[i]
			str += `- (${numberParser(item.quantity)}x) ${item.type} ${item.name}\n`
		}
		str += `\`\`\``
		return str
	}
}

module.exports.help = {
	start: Inventory,
	name: `inventory`,
	aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`],
	description: `Views all items in your inventory`,
	usage: `inventory <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}