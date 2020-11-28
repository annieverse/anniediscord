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
		this.banner = `https://i.ibb.co/d50XDjN/shop-gateway.png`
		this.itemFilter = item => {
			return item.type_name.toLowerCase() === this.fullArgs.toLowerCase()
			|| item.type_name.toLowerCase() === (this.fullArgs.toLowerCase()+`s`)
			|| item.type_alias.toLowerCase() === this.fullArgs.toLowerCase()
		}
		this.shopCode = {
			1: `annieShop`,
			2: `serverShop`
		}
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji, commanifier, bot:{db} }) {
		await this.requestUserMetadata(1)
		//  Temporary close
		return reply(this.locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji:emoji(`AnniePeek2`)}})
		//  Fetch purchasable items in the db
		this.items = await db.getPurchasableItems()
		if (!this.items.length) return reply(this.locale.SHOP.UNAVAILABLE, {socket: {emoji: emoji(`AnnieCry`)}})
		console.debug(this.items)
		//  Prepare gateway
		this.gatewaySelection = await reply(this.locale.SHOP.GATEWAY_SELECTION, {
			header: `Hi, ${name(this.user.id)}!`,
			prebuffer: true,
			image: this.banner,
			socket: {
				emoji: emoji(`AnnieYay`),
				guild: this.message.guild.name
			}
		})
		this.setSequence(15)
		this.sequence.on(`collect`, async r => {
			const input = parseInt(r.content)
			//  Ignore if input doesn't match
			if (![1, 2].includes(input)) return
			r.delete()
			this.gatewaySelection.delete()
			return this[this.shopCode[input]](...arguments)
		})
	}

	async annieShop({ reply, name, emoji, avatar, commanifier, bot:{db} }) {
		// display all the purchasable items and sort by item's price.
		const sortedItems = items.sort((a,b) => b.price - a.price)
		this.fetching = await reply(this.locale.SHOP.RETRIEVING, {simplified: true, socket: {emoji: emoji(`AAUloading`), itemType: `items`}})
		await reply(this.splittingList(sortedItems, emoji, commanifier), {
			paging: true,
			color: `#ffc9e2`,
			header: `Annie's Shop!`,
			thumbnail: this.bot.user.displayAvatarURL(),
			topNotch: `╭*:;,．★ ～☆*────────────╮\n**__${name(this.user.id)}'s' Current Balance__**
			${emoji(`artcoins`)}**\`${commanifier(this.user.inventory.artcoins || 0)}\`** and ${emoji(`magical_paper`)}**\`${commanifier(this.user.inventory.magical_paper || 0)}\`**\n╰──────────☆～*:;,．*╯\n・・・・・・・・・・・・`,
		})
		return this.fetching.delete()
	}

	splittingShopCategory() {

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
			const displayedItem = `**(ID: ${item.item_id})**～☆──── ${emojiParser(item.alias)} **${item.name}** 
				> ${item.rarity_name} ${item.type_name}
				> Can be purchased for ${emojiParser(item.item_price_alias)}**\`${commaParser(item.price)}\`** @each
				> Interested to purchase? type __${this.bot.prefix}buy 5 ${item.name.toLowerCase()}__\n\n `
			
			//  If iteration has reached the limit, reset list & shift to next index in the array.
			if (state >= 5) {
				box.push(list)
				state = 0
				list = ``
			}
			//  If array has less than 5 elements, lock totalElements mutation.
			else if (totalElements < 5) {
				list += displayedItem

				if ((items.length-1) != key) continue
				box.push(list)
				break			
			}

			list += displayedItem
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
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}
