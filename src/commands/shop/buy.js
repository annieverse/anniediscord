const Transaction = require(`../../struct/transactions/handler`)
const Checkout = require(`../../struct/transactions/checkout`)
const preview = require(`../../config/itemPreview`)

/**
 * Main module
 * @Buy as transaction initializer
 */
class Buy {
	constructor(Stacks) {
		this.stacks = Stacks
		this.categories = [`Roles`, `Tickets`, `Skins`, `Badges`, `Covers`, `Unique`,`Sticker`]
	}

	get availiableCovers() {
		const { bot: { db } } = this.stacks
		return db.getCovers
	}

	get availiableStickers() {
		const { bot: { db } } = this.stacks
		return db.getStickers
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {

		const { reply, args, name, message, code:{BUY}, meta: { author, data }, db, palette } = this.stacks
		
		//  Returns no parametered input
		if (!args[0]) return reply(BUY.SHORT_GUIDE)

		const key = args[0].toUpperCase()

		var category = this.categories.find((i) => i.toLowerCase().includes(key.toLowerCase()))
		//  Returns if category is invalid
		if (!category) return reply(BUY.INVALID_CATEGORY)

		//  Returns if item is invalid
		if (!args[1]) return reply(BUY.MISSING_ITEMNAME)

		let transactionComponents = {
			itemname: message.content.substring(message.content.indexOf(args[1])).toLowerCase(),
			type: category,
			message: message,
			author: author,
			usermetadata: data
		}
		let transaction = new Transaction(transactionComponents)
		let item = await transaction.pull

		//  Returns if item is not valid
		if (!item) return reply(BUY.INVALID_ITEM)

		let badgesOnLimit = Object.values(await data.badges).indexOf(null) === -1
		let badgesHaveDuplicate = Object.values(await data.badges).includes(item.alias)
		let query1 = await db(author.id)._query(`
			SELECT itemId FROM itemlist 
			WHERE alias = ?`
			, `get`
			, [item.price_type])
		let query2 = await db(author.id)._query(`
			SELECT itemId FROM itemlist 
			WHERE alias = ?`
			, `get`
			, [item.alias])

		item.currencyId = query1.itemId
		item.itemId = query2.itemId

		const switchColor = {

			"dark_profileskin": {
				base: palette.nightmode,
				border: palette.deepnight,
				text: palette.white,
				secondaryText: palette.lightgray,
				sticker: `light`
			},

			"light_profileskin": {
				base: palette.white,
				border: palette.lightgray,
				text: palette.darkmatte,
				secondaryText: palette.blankgray,
				sticker: `dark`
			}
		}
		const usercolor = data.rank.color

		let checkoutComponents = {
			itemdata: item,
			transaction: transaction,
			// Is there a preview, yes = [is the item a sticker, yes = [is the sticker them specific, yes= add light or dark, no = return sticker alias name], no = return asset alias], no = return null
			preview: preview[key] ? category === `Sticker` ? await db(author.id).stickerTheme(item.alias) ? `sticker_${item.alias}_${switchColor[usercolor].sticker}` : `sticker_${item.alias}` : item.alias : null,
			stacks: this.stacks,
			msg: message,
			user: author
		}

		//  Returns if user lvl doesn't meet requirement to buy roles
		if (transactionComponents.type === `Roles` && data.level < 25) return reply(BUY.ROLES_LVL_TOO_LOW)
        
		//  Reject duplicate skin.
		if (transactionComponents.type === `Skins` && data.interfacemode === item.alias) return reply(BUY.DUPLICATE_SKIN)

		//  No available slots left
		if (transactionComponents.type === `Badges` && badgesOnLimit) return reply(BUY.BADGES_LIMIT)

		//  Reject duplicate badge alias
		if (transactionComponents.type === `Badges` && badgesHaveDuplicate) return reply(BUY.DUPLICATE_BADGE)

		//  Reject duplicate cover alias.
		let covers = await this.availiableCovers
		if (transactionComponents.type === `Covers` && data.cover === item.alias) return reply(BUY.DUPLICATE_COVER)
		
		if (transactionComponents.type === `Covers` && covers.map(element => element.alias).includes(item.alias)) return reply(BUY.COVER_IN_INVENTORY)

		let stickers = await this.availiableStickers
		if (transactionComponents.type === `Sticker` && data.sticker === item.alias) return reply(BUY.DUPLICATE_STICKER)

		if (transactionComponents.type === `Sticker` && stickers.map(element => element.alias).includes(item.alias)) return reply(BUY.STICKER_IN_INVENTORY)

		let noItem = data[item.price_type] == undefined
		let balanceTooLow = data[item.price_type] < item.price
		//  Returns if balance is insufficent
		if ( balanceTooLow || noItem) return reply(BUY.INSUFFICIENT_BALANCE, {
			socket: [name(author.id), item.price_type]
		})

		return new Checkout(checkoutComponents).confirmation()
	}
}

module.exports.help = {
	start: Buy,
	name: `buy`,
	aliases: [],
	description: `buy an item from the shop`,
	usage: `buy <category> <item>`,
	group: `shop`,
	public: true,
	required_usermetadata: true,
	multi_user : false,
	special_channels: [`614819522310045718`]
}