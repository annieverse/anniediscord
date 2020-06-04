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
		this.itemFilter = item => {
			return item.type_name.toLowerCase() === this.fullArgs.toLowerCase()
			|| item.type_name.toLowerCase() === (this.fullArgs.toLowerCase()+`s`)
			|| item.type_alias.toLowerCase() === this.fullArgs.toLowerCase()
		}
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, commanifier, loadAsset, bot:{db, locale:{SHOP}} }) {
		await this.requestUserMetadata(1)
		//  Fetch purchasable items in the db
		const items = await db.getPurchasableItems()
		if (!items.length) return reply(this.locale.SHOP.UNAVAILABLE, {socket: {emoji: emoji(`AnnieCry`)}, color: `red`})
		//  Handle if user has requested specific shop category
		if (this.fullArgs) {
			const specificItemsType = items.filter(this.itemFilter)
			if (!specificItemsType.length) return reply(this.locale.SHOP.INVALID_TYPE, {socket: {emoji: emoji(`AnnieCry`)}, color: `red`})
			const sortedItems = specificItemsType.sort((a,b) => a.price - b.price)
			return reply(this.splittingList(sortedItems, emoji, commanifier), {paging: true})
		}
		//  Else, display all the purchasable items and sort by item's type name.
		const sortedItems = items.sort((a,b) => a.type_id - b.type_id)
		return reply(this.splittingList(sortedItems, emoji, commanifier), {paging: true})
	}

	/**
	 * Organize and split list from returned array of [Database.getPurchasableItems()]
	 * @param {array} [items=[]] Returned result from [Database.getPurchasableItems()]
	 * @param {function} [emojiParser] Ref to [Pistachio.emoji()]
	 * @param {function} [commaParser] parsing number into comma format. Ref to [Pistachio.commaParser]
	 * @returns {array}
	 */
	splittingList(items=[], emojiParser, commaParser) {
		let box = []
		let state = 0
		let list = ``
		for (let key in items) {
			const item = items[key]
			//  If iteration has reached the limit, reset list & shift to next index in the array.
			if (state >= 5) {
				box.push(list)
				state = 0
				list = ``
			}
			list += `${emojiParser(item.alias)} [${item.type_name}] **${item.name}** 
			\`${item.description}\`
			${emojiParser(item.item_price_alias)}${commaParser(item.price)}\n\n`
			state++
		}
		return box
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
