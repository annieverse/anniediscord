const Command = require(`../../libs/commands`)
/**
 * Buy any purchasable items in the shop!
 * @author klerikdust
 */
class Buy extends Command {

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
    async execute({ reply, emoji, name, trueInt, commanifier, loadAsset, bot:{db, locale:{BUY}} }) {
    	await this.requestUserMetadata(2)

		//  Returns no parametered input
		if (!this.fullArgs) return reply(BUY.SHORT_GUIDE)
		//  Connect space between words with underscore(_) if user has included whitespace
		const itemKeyword = this.fullArgs.replace(/\ /g, `_`)
		const item = await db.getItem(itemKeyword)
		//  Returns if item with the given keyword cannot be found
		if (!item) return reply(BUY.INVALID_ITEM, {color: `red`})
		//  Returns if the target item is not available to buy
		if (!item.available_on_shop) return reply(BUY.ITEM_CANT_BE_BOUGHT, {color: `red`})
		//  Handle if the item doesn't allow user to multi-stacking and user already have it
		const selectedItemInsideInventory = this.user.inventory.raw.filter(key => key.item_id === item.item_id)
    	if ((selectedItemInsideInventory.length >= 1) && item.max_stacks <= 1) {
    		return reply(BUY.NO_DUPLICATE_ITEM, {color: `red`, socket: [`${item.name} ${item.type}`]})
    	}

    	//  Initialize sequences and item vars
	    this.setSequence(5)
	    let itemPreview = await loadAsset(item.alias)
		let amount = 1
		let total = item.price * amount 

	    
    	//  Ask user to input the amount to buy if multi-stacking is allowed
    	if (item.max_stacks > 1) {
    		reply(BUY.ITEM_AMOUNT, {color: `golden`, socket: [item.name]})
    	}
    	else {
			reply(BUY.CHECKOUT_PREVIEW, {
				socket: [emoji(`artcoins`), commanifier(item.price), item.name],
				color: `golden`,
				image: itemPreview,
				prebuffer: true
			})
			//  Skip the ask-for-amount page
		    this.nextSequence() 
    	}

		this.sequence.on(`collect`, async msg => {
			let input = msg.content.toLowerCase()
			msg.delete()

			/** --------------------
			 *  Sequence Cancellations
			 *  --------------------
			 */
			if (this.cancelParameters.includes(input)) {
				reply(BUY.TRANSACTION_CANCELLED)
				return this.endSequence()
			}

			/** --------------------
			 *  1.) Ask user for amount to buy
			 *  --------------------
			 */
			if (this.onSequence <= 1) {
				amount = trueInt(input)
				//  Handle if given amount is not valid
				if (!amount) return reply(BUY.INVALID_ITEM_AMOUNT, {socket: emoji(`AnnieMad`), color: `red`})
				total = item.price * amount 
				reply(BUY.CHECKOUT_PREVIEW, {
					socket: [emoji(`artcoins`), commanifier(total), `(${commanifier(amount)}x)${item.name}`],
					color: `golden`,
					image: itemPreview,
					prebuffer: true
				})
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
				if (this.user.inventory.artcoins < total) {
					reply(BUY.INSUFFICIENT_BALANCE, {
						socket: [emoji(`artcoins`), commanifier(total)], 
						color: `red`
					})
					return this.endSequence()
				}

				//  Deduct balance & deliver item
				await db.updateInventory({itemId: 52, value: total, operation: `-`, userId: this.user.id})
				await db.updateInventory({itemId: item.item_id, value: 1, operation: `+`, userId: this.user.id})

				reply(BUY.SUCCESSFUL, {color: `lightgreen`, socket:[`(${commanifier(amount)}x)${item.name}`, emoji(`AnnieSmile`)]})
				return this.endSequence()
			}	
		})
	}
}

module.exports.help = {
	start: Buy,
	name: `buy`,
	aliases: [`purchase`, `redeem`],
	description: `Buy any purchasable items in the shop!`,
	usage: `buy <ItemID/ItemName>`,
	group: `shop`,
	permissionLevel: 0,
	multiUser: false
}