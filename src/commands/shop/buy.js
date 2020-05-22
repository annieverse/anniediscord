const Command = require(`../../libs/commands`)
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
			|| item.item_id === parseInt(this.fullArgs)
			|| item.alias === this.fullArgs.toLowerCase().replace(` `, `_`)
		}
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
		//  Handle if item with the given keyword cannot be found
		const item = purchasableItems.filter(this.itemFilter)[0]
		if (!item) return reply(this.locale.BUY.INVALID_ITEM, {color: `red`})
		//  Handle if the item doesn't allow user to multi stack and user already have it
		const selectedItemInsideInventory = this.user.inventory.raw.filter(key => key.item_id === item.item_id)
    	if ((selectedItemInsideInventory.length >= 1) && item.type_max_stacks <= 1) {
    		return reply(this.locale.BUY.NO_DUPLICATE_ITEM, {color: `red`, socket: {itemType: item.type_name}})
    	}

	    this.setSequence(10)
	    const previewItem = await loadAsset(item.alias)
		const paymentItem = await db.getItem(item.item_price_id)

    	//  Ask user to input the amount to buy if multi-stacking is allowed
    	if (item.type_max_stacks > 1) {
    		this.askAmount = await reply(this.locale.BUY.ITEM_AMOUNT, {color: `golden`, socket: {item: `${emoji(item.alias)} ${item.name}`}})
    	}
    	else {
    		this.amount = 1
			this.checkout = await reply(this.locale.BUY.CHECKOUT_PREVIEW, {
				socket: {
					total: `${emoji(paymentItem.alias)}${commanifier(item.price)}`,
					item: `[${this.amount}x]${item.name}`
				},
				color: `golden`,
				image: previewItem,
				prebuffer: true
			})
			//  Skip the ask-for-amount page
		    this.nextSequence() 
    	}

		this.sequence.on(`collect`, async msg => {
			let input = msg.content.toLowerCase()

			/** --------------------
			 *  Sequence Cancellations
			 *  --------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			/** --------------------
			 *  1.) Ask user for amount to buy
			 *  --------------------
			 */
			if (this.onSequence <= 1) {
				this.amount = trueInt(input)
				//  Handle if given amount is not valid
				if (!this.amount) return reply(this.locale.BUY.INVALID_ITEM_AMOUNT, {socket: {emoji: emoji(`AnnieDead`)}, color: `red`})
				this.total = item.price * this.amount 
				this.checkout = await reply(this.locale.BUY.CHECKOUT_PREVIEW, {
					socket: {
						total: `${emoji(paymentItem.alias)}${commanifier(this.total)}`,
						item: `[${commanifier(this.amount)}x]${item.name}`
					},
					color: `golden`,
					image: previewItem,
					prebuffer: true
				})
				this.askAmount.delete()
				return this.nextSequence()
			}

			/** --------------------
			 *  2.) Checkout
			 *  --------------------
			 */
			if (this.onSequence <= 2) {
				//  Ghostingly ignore if user didn't type the confirmation word
				if (!input.startsWith(`y`)) return
				//  Handles if user's balance is onsufficient to pay the total
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
				await db.updateInventory({itemId: paymentItem.item_id, value: this.total, operation: `-`, userId: this.user.id})
				await db.updateInventory({itemId: item.item_id, value: this.amount, operation: `+`, userId: this.user.id})
				reply(this.locale.BUY.SUCCESSFUL, {
					color: `lightgreen`,
					socket: {
						item: `[${commanifier(this.amount)}x]${item.name}`,
						emoji: emoji(`AnnieSmile`)
					}
				})

				msg.delete()
				this.checkout.delete()
				return this.endSequence()
			}	
		})
	}
}

module.exports.help = {
	start: Buy,
	name: `buy`,
	aliases: [`purchase`, `redeem`],
	description: `Buy any purchasable items our shop!`,
	usage: `buy <ItemID/ItemName>`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}