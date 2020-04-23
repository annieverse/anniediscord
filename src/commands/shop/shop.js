const Command = require(`../../libs/commands`)
/**
 * Buy any purchasable items in our shop!
 * @author klerikdust
 */
class Shop extends Command {

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
    async execute({ reply, emoji, commanifier, loadAsset, bot:{db, locale:{SHOP}} }) {
		await this.requestUserMetadata(1)
		//  Fetch purchasable items in the db
		const items = await db.getPurchasableItems(10)
		if (!items.length) return reply(SHOP.UNAVAILABLE, {socket: [emoji(`AnnieCry`)], color: `red`})
		return reply(this.displayResult(items, emoji, commanifier))
	}

	displayResult(items={}, emojiParser, commaParser) {
		let str = ``
		for (let key in items) {
			const item = items[key]
			str += `${emojiParser(`artcoins`)} **${commaParser(item.price)} -** (${`★`.repeat(item.rarity)}) ${item.name}
			\`${item.description}\`\n\n`
		}
		return str
	}
}

module.exports.help = {
	start: Shop,
	name: `shop`,
	aliases: [`shops`, `marketplace`, `market`],
	description: `Buy any purchasable items in our shop!`,
	usage: `shop`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}
