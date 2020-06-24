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
    async execute({ reply, emoji, commanifier, bot:{db} }) {
		await this.requestUserMetadata(1)
		//  Fetch purchasable items in the db
		const items = await db.getPurchasableItems()
		if (!items.length) return reply(this.locale.SHOP.UNAVAILABLE, {socket: {emoji: emoji(`AnnieCry`)}, color: `red`})
		//  Handle if user has requested specific shop category
		if (this.fullArgs) {
			const specificItemsType = items.filter(this.itemFilter)
			if (!specificItemsType.length) return reply(this.locale.SHOP.INVALID_TYPE, {socket: {emoji: emoji(`AnnieCry`)}, color: `red`})
			this.fetching = await reply(this.locale.SHOP.RETRIEVING, {simplified: true, socket: {emoji: emoji(`AAUloading`), itemType: this.fullArgs}})
			const sortedItems = specificItemsType.sort((a,b) => a.price - b.price)
			await reply(this.splittingList(sortedItems, emoji, commanifier), {paging: true})
			return this.fetching.delete()
		}
		//  Else, display all the purchasable items and sort by item's price.
		const sortedItems = items.sort((a,b) => b.price - a.price)
		this.fetching = await reply(this.locale.SHOP.RETRIEVING, {simplified: true, socket: {emoji: emoji(`AAUloading`), itemType: `items`}})
		await reply(this.splittingList(sortedItems, emoji, commanifier), {paging: true, color: `golden`})
		return this.fetching.delete()
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
		let totalElements = parseInt(items.length)

		for (let key=0; key<items.length; key++) {
			const item = items[key]
			//  If iteration has reached the limit, reset list & shift to next index in the array.
			if (state >= 5) {
				box.push(list)
				state = 0
				list = ``
			}
			//  If array has less than five elements, lock totalElements mutation.
			else if (totalElements < 5) {
				list += `${emojiParser(item.alias)} [${item.type_name}] **${item.name}** 
				\`${item.description}\`
				${emojiParser(item.item_price_alias)}${commaParser(item.price)}\n\n`
				state++

				if ((items.length-1) != key) continue
				box.push(list)
				break			
			}

			list += `${emojiParser(item.alias)} [${item.type_name}] **${item.name}** 
			\`${item.description}\`
			${emojiParser(item.item_price_alias)}${commaParser(item.price)}\n\n`
			state++
			totalElements = totalElements - 1
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
