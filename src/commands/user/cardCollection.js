const GUI = require(`../../ui/prebuild/cardCollection`)
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
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, emoji, name }) {
		await this.requestUserMetadata(2)
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		//  Fetch cards type in user's inventory and sort by rarity descendantly
		const filteredInventory = this.user.inventory.raw.filter(prop => prop.type === `CARDS`).sort((a,b) => (a.rarity < b.rarity))
		const INVALID_INVENTORY = this.user.isSelf ? this.locale.CARDCOLLECTION_AUTHOR_EMPTY : this.locale.CARDCOLLECTION_OTHERUSER_EMPTY
		if (!filteredInventory.length) return reply (INVALID_INVENTORY, {color: `red`, socket: {user: name(this.user.id)}})
		reply(this.locale.COMMAND.FETCHING, {simplified: true, socket:{command: `cards collection`, user: this.user.id, emoji: emoji(`AAUloading`)}})
		.then(async loading => {
			await reply(this.locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: await new GUI(filteredInventory).create(),
				socket: {
					user: name(this.user.id),
					emoji: emoji(`AnniePogg`),
					command: `Cards Collection`
				}
			})
			loading.delete()
			return reply(this.displayDetailedCardCollection(filteredInventory), {simplified: true})
		})
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
			str += `- (${`★`.repeat(item.rarity)}) ${item.name}\n`

		}
		str += `\`\`\``
		return str
	}
}

module.exports.help = {
	start: CardCollection,
	name: `cardCollection`,
	aliases: [`cardcollection`, `mycard`, `card`, `cards`],
	description: `View yours or someones collected cards`,
	usage: `cardcollection`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}