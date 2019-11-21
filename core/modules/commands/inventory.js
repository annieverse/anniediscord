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
		const { command, code: {INVENTORY}, bot:{db}, name, reply, emoji } = this.stacks


		//  Returns if user is invalid
		if (!this.author) return reply(INVENTORY.INVALID_USER)
		//  Get user's inventory metadata
		let Inventory = Filter({
			container: await db.pullInventory(this.author.id),
			strict: true
		})

		function textOpt(inv){
			let response = `Item: Quantity\n`
			inv.forEach((element,index) => {
				index == inv.length-1 ? response += `${element.name}: ${element.quantity}` : response += `${element.name}: ${element.quantity}\n`
			});
			return response
		}
		
		//  Display result
		command.includes(`text`) || command.includes(`tex`) || command.includes(`t`) || command.includes(`tx`) ? 
			reply(INVENTORY.FETCHING, { socket: [name(this.author.id)], simplified: true })
				.then(async load => {

					reply(`${INVENTORY.HEADER}\n${textOpt(Inventory)}`, {
						socket: [emoji(`AnnieYandere`), name(this.author.id)],
						simplified: true
					})
					load.delete()
				})
			:
			reply(INVENTORY.FETCHING, { socket: [name(this.author.id)], simplified: true })
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
	aliases: [`inventory`, `inv`, `bag`, `invent`, `inven`,
		`inventorytx`, `invtx`, `bagtx`, `inventtx`, `inventx`,
		`inventorytex`, `invtex`, `bagtex`, `inventtex`, `inventex`,
		`inventorytext`, `invtext`, `bagtext`, `inventtext`, `inventext`,
		`inventoryt`, `invt`, `bagt`, `inventt`],
	description: `Views your inventory`,
	usage: `inventory`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}