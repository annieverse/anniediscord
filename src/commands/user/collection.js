const Command = require(`../../libs/commands`)
/**
 * Views all items in your inventory
 * @author klerikdust
 */
class CardCollection extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		/**
		 * The display limit for each page
		 * @type {number}
		 */
		this.upperLimit = 10
		this.banner = `https://i.ibb.co/rvmZCBW/cardcollection.png`
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, emoji, name, avatar }) {
		await this.requestUserMetadata(2)
		if (!this.user) return reply(this.locale.USER.IS_INVALID)
		//  Fetch cards type in user's inventory and sort by rarity descendantly
		let filteredInventory = this.user.inventory.raw.filter(prop => prop.type_name.toUpperCase() === `CARDS`).sort((a,b) => (b.rarity_level - a.rarity_level))
		this.shouldSplitResult = true
		this.splittedInventory = []
		let box = []
		let checkpoint = 0
		for (let i=0; i<filteredInventory.length; i++) {
			checkpoint++
			box.push(filteredInventory[i])
			if (checkpoint === this.upperLimit || i == filteredInventory.length-1) {
				this.splittedInventory.push(box)
				box = []
				checkpoint = 0
			}
		}		
		const INVALID_INVENTORY = this.user.isSelf ? this.locale.CARDCOLLECTION_AUTHOR_EMPTY : this.locale.CARDCOLLECTION_OTHERUSER_EMPTY
		if (!filteredInventory.length) {
			return reply (INVALID_INVENTORY, {
				prebuffer: true,
				image: this.banner,
				socket: {
					prefix: this.bot.prefix,
					emoji: emoji(`AnnieCry`),
					user: name(this.user.id)
				},
				footer: this.user.isSelf ? this.locale.CARDCOLLECTION_EMPTY_TIPS : null
			})
		}
		reply(this.locale.COMMAND.FETCHING, {simplified: true, socket:{command: `cards collection`, user: this.user.id, emoji: emoji(`AAUloading`)}})
		.then(async loading => {
			await reply(this.prettifiedCardInventory(), {
				paging: true,
				cardPreviews: this.splittedInventory,
				thumbnail: avatar(this.user.id),
				header: `${name(this.user.id)}'s Card Collections`
			})
			return loading.delete()
		})
	}

	prettifiedCardInventory() {
		let arr = []
		for (let i=0; i<this.splittedInventory.length; i++) arr.push(this.displayDetailedCardCollection(this.splittedInventory[i]))
		return arr
	}

	/**
	 * 	Prettify result from `this.user.inventory.raw`
	 * 	@param {array} [inventory=[]] user's raw inventory metadata
	 *  @returns {string}
	 */
	displayDetailedCardCollection(inventory=[]) {
		let str = `\`\`\`\n`
		for (let i=0; i<inventory.length; i++) {
			const item = inventory[i]
			str += `- [${item.quantity}x](${`★`.repeat(item.rarity_level)}) ${item.name}\n`

		}
		str += `\`\`\``
		return str
	}
}

module.exports.help = {
	start: CardCollection,
	name: `collection`,
	aliases: [`cardcollection`, `mycard`, `card`, `cards`, `cc`],
	description: `View yours or someones collected cards`,
	usage: `collection`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}