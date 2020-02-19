const GUI = require(`../../struct/gui/inventory`)

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
	 * 	Filtering object
	 * 	@param {Object} container user inventory metadata
	 */
	wrangle({container={}, strict=false}) {
		//  Only remove unavailable items (0/null/undefined)
		let DefaultFilter = (obj) => obj.filter(prop => prop.quantity != false)
		//	Additionally excluding card from result if prompted
		let AdvancedFilter = (obj) => obj.filter(prop => (prop.quantity != false) && (prop.type != `Card`) && (prop.type != `Covers`) && (prop.type != `Roles`) && (prop.type != `Sticker`) && (prop.type != `Badges`) && (prop.type != `Package Items`))
		//	Sorting object (descending)
		let Sorted = (obj) => obj.sort((a,b) => (a.quantity < b.quantity) ? 1 : ((b.quantity < a.quantity) ? -1 : 0))
		return strict ? Sorted(AdvancedFilter(container)) : Sorted(DefaultFilter(container))
	}


	/**
     *  Initialzer method
     */
	async execute() {
		const { code: { INVENTORY }, bot: { db }, name, reply, emoji, textOption } = this.stacks


		//  Returns if user is invalid
		if (!this.author) return reply(INVENTORY.INVALID_USER)
		//  Get user's inventory metadata
		let Inventory = this.wrangle({
			container: await db.pullInventory(this.author.id),
			strict: true
		})

		function textOpt(inv){
			let response = `Item: Quantity\n`
			inv.forEach((element,index) => {
				index == inv.length-1 ? response += `${element.name}: ${element.quantity}` : response += `${element.name}: ${element.quantity}\n`
			})
			return response
		}
		
		//  Display result
		textOption ? 
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
		`inventorytext`, `invtext`, `bagtext`, `inventtext`, `inventext`],
	description: `Views your inventory`,
	usage: `inventory`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}