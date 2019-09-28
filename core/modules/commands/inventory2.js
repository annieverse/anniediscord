const Filter = require(`../../utils/inventoryContainerManager2`)
const GUI = require(`../../utils/inventoryInterface2`)

/**
 * Main module
 * @Inventory Display user's inventory bag.
 */
class Inventory {
	constructor(Stacks) {
		this.author = Stacks.meta.author
		this.theme = Stacks.meta.data.interfacemode
		this.stacks = Stacks
	}

	/**
     *  Initialzer method
     */
	async execute() {
		const { code: {INVENTORY}, bot:{db}, name, reply, emoji } = this.stacks


		//  Returns if user is invalid
		if (!this.author) return reply(INVENTORY.INVALID_USER)
		//  Get user's inventory metadata
		let Inventory = Filter({
			container: await db.pullInventory(this.author.id),
			strict: true
		})


		//  Display result
		return reply(INVENTORY.FETCHING, {socket: [name(this.author.id)], simplified: true})
			.then(async load => {

				reply(INVENTORY.HEADER, {
					socket: [emoji(`AnnieWot`), name(this.author.id)],
					image: await GUI(Inventory, this.theme),
					prebuffer: true,
					simplified: true
				})
				load.delete()
			})
	}
}

module.exports.help = {
	start: Inventory,
	name: `inventory2`,
	aliases: [`inventory2`, `inv`],
	description: `Views your inventory`,
	usage: `inventory2`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}