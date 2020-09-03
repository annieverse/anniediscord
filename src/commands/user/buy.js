const Command = require(`../../libs/commands`)
const stringSimilarity = require('string-similarity');
/**
 * Buy any purchasable items our shop!
 * @author klerikdust
 */
class Buy extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.itemFilter = item => {
			return item.name.toLowerCase() === this.fullArgs.toLowerCase()
			|| item.alias === this.fullArgs.toLowerCase().replace(` `, `_`)
			|| item.item_id === parseInt(this.fullArgs)
		}
		/**
		 * Insert the type id into this array if you wish to display its preview when user purchasing it.
		 * @type {array}
		 */
		this.availablePreviews = [1, 3, 9]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, trueInt, commanifier, loadAsset, bot:{db} }) {
    	await this.requestUserMetadata(2)

		//  Handle if there are no items available to purchase
		const purchasableItems = await db.getPurchasableItems()
		if (!purchasableItems.length) return reply(this.locale.BUY.EMPTY_SHOP, {color: `red`})
		//  Display guide if user doesn't specify any additional arg
		if (!this.fullArgs) return reply(this.locale.BUY.SHORT_GUIDE, {socket: {prefix: this.prefix}})

		/**
		 * --------------------
		 * DYNAMIC SEARCH STRING
		 * --------------------
		 * Browser items to the closest keyword that given by the user.
		 * By doing this, they can simply type `buy 10 chocolate`, `buy chocolate` or even `buy chocs 10`
		 * up to their preference. The goal is to make the syntax as semantic as possible.
		 *
		 * If searching string by closest rating point is not possible, or the rating is too low
		 * Then it'll use the old method which suports search by item ID or item alias, but less accurate.
		 */
		let searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, purchasableItems.map(i => i.name))
		this.item = searchStringResult.bestMatch.rating >= 0.4
		? purchasableItems.filter(i => i.name === searchStringResult.bestMatch.target)[0] 
		: purchasableItems.filter(this.itemFilter)[0]
		//  Handle if item with the given keyword cannot be found
		if (!this.item) return reply(this.locale.BUY.INVALID_ITEM, {color: `red`})
		//  Incase user attempted to include unit-amount shorhandedly.
		this.amountToBuy = !this.args[1] ? 1 : this.fullArgs.replace(/\D/g, ``)

		/**
		 * --------------------
		 * PREVENT PURCHASING DUPE ITEM
		 * --------------------
		 * Handle if the item doesn't allow user to have multi stack
		 * and user must already has the item.
		 * 
		 * In order to successfully preventing user from buying dupe item:
		 *  1.) Item's type must limiting the allowed stacks that user could have.
		 *  2.) User must already at least one of the item in their inventory.
		 */
		const selectedItemInsideInventory = this.user.inventory.raw.filter(key => key.item_id === this.item.item_id)
    	if ((selectedItemInsideInventory.length >= 1) && this.item.type_max_stacks <= 1) {
    		return reply(this.locale.BUY.NO_DUPLICATE, {color: `red`, socket: { itemType: this.item.type_name.toLowerCase() }})
    	}

	    const previewItem = await loadAsset(this.item.alias)
		const paymentItem = await db.getItem(this.item.item_price_id)

		//  Handle if the payment is currently not supported.
		if (!paymentItem.item_id) return reply(this.locale.BUY.PAYMENT_UNSUPPORTED, {color: `red`})
		//  Handle if item (Nickname Changer) isn't available to purchase in the current guild.
		if (this.item.item_id == 1 && !this.bot.nickname_changer) return reply(this.locale.BUY.ITEM_NOTAVAILABLE_IN_THE_GUILD, {
			color: `red`,
			socket: {item: this.item.name}
		})

		this.amountToBuy = this.amountToBuy || 1
		this.total = this.item.price * this.amountToBuy
		this.checkout = await reply(this.locale.BUY.CHECKOUT_PREVIEW, {
			socket: {
				total: `${emoji(paymentItem.alias)}${commanifier(this.total)}`,
				item: `[${this.amountToBuy}x]${this.item.name}`,
				itemType: this.item.type_name.toLowerCase()
			},
			color: `golden`,
			image: this.availablePreviews.includes(this.item.type_id) ? previewItem : null,
			prebuffer: true
		})

		/**
		 * --------------------
		 * REACT-BASED CONFIRMATION (EXPERIMENTAL)
		 * --------------------
		 * @author klerikdust
		 * I've decided to try out this button-style of confirmation
		 * since it seems easier to reach and more intuitive especially for mobile user.
		 *
		 * I'll plan to move this to its own lib component once I get good feedback about this change,
		 * and hopefully the user receiving less error.
		 */
		await this.checkout.react(`✅`)
        const confirmationButtonFilter = (reaction, user) => reaction.emoji.name === `✅` && user.id === this.message.author.id
        const confirmationButton = this.checkout.createReactionCollector(confirmationButtonFilter, { time: 120000 })
 		confirmationButton.on(`collect`, async r => {
			//  Handles if user's balance is onsufficient to pay the total
			if (!this.user.inventory[paymentItem.alias]){
				reply(this.locale.BUY.INSUFFICIENT_BALANCE, {
					socket: {
						emoji: emoji(paymentItem.alias),
						amount: commanifier(this.total)
					}, 
					color: `red`
				})
				return this.endSequence()
			}
			if (this.user.inventory[paymentItem.alias] < this.total) {
				reply(this.locale.BUY.INSUFFICIENT_BALANCE, {
					socket: {
						emoji: emoji(paymentItem.alias),
						amount: commanifier(this.total - this.user.inventory[paymentItem.alias])
					}, 
					color: `red`
				})
				return this.endSequence()
			}
			//  Deduct balance & deliver item
			await db.updateInventory({itemId: paymentItem.item_id, value: this.total, operation: `-`, userId: this.user.id, guildId: this.message.guild.id})
			await db.updateInventory({itemId: this.item.item_id, value: this.amountToBuy, operation: `+`, userId: this.user.id, guildId: this.message.guild.id})
			reply(this.locale.BUY.SUCCESSFUL, {
				color: `lightgreen`,
				socket: {
					item: `${emoji(this.item.alias)} [${this.item.type_name}] ${commanifier(this.amountToBuy)}x ${this.item.name}`,
					emoji: emoji(`success`)
				}
			})
			this.checkout.delete()

			//  Ask user if they want to apply to cover right away or not.
			if (this.item.type_id === 1) {
				this.coverQuickApplyPrompt = await reply(this.locale.BUY.QUICKAPPLY_COVER, {simplified: true})
				await this.coverQuickApplyPrompt.react(`✅`)
		        const coverQuickApplyButtonFilter = (reaction, user) => reaction.emoji.name === `✅` && user.id === this.message.author.id
		        const coverQuickApplyButton = this.coverQuickApplyPrompt.createReactionCollector(coverQuickApplyButtonFilter, { time: 120000 })
		        coverQuickApplyButton.on(`collect`, async r => {
		        	this.coverQuickApplyPrompt.delete()
					await this.bot.db.detachCovers(this.user.id, this.message.guild.id)
		        	await this.bot.db.useItem(this.item.item_id, this.user.id, this.message.guild.id)
		        	return reply(this.locale.SETPROFILE.SUCCESSFUL, {
		        		color: `lightgreen`,
		        		socket: {
		        			item: `${emoji(this.item.alias)} ${this.item.name}`,
		        			itemType: `cover`,
		        			actionType: `equipped`
		        		}
		        	})
		        })
			}	
 		})
	}
}

module.exports.help = {
	start: Buy,
	name: `buy`,
	aliases: [`purchase`, `buyy`],
	description: `Buy any purchasable items in our shop!`,
	usage: `buy <ItemID/ItemName>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}