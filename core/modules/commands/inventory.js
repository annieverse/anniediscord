const Filter = require(`../../utils/inventoryContainerManager`)
const GUI = require(`../../utils/inventoryInterface`)

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
					socket: [emoji(`AnnieYandere`), name(this.author.id)],
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
	name: `inventory`,
	aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`],
	description: `Views your inventory`,
	usage: `inventory`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}