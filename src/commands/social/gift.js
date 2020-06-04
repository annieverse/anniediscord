const Command = require(`../../libs/commands`)
/**
 * Send gifts to your friends! They will receive 1 reputation point for each gift you send.
 * @author klerikdust
 */
class Gift extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.itemFilter = item => (item.type_name === `Gifts`) && (item.quantity > 0)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, avatar, commanifier, name, trueInt, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)

		// Handle if user doesn't specify anything
		if (!this.fullArgs) return reply(this.locale.GIFT.SHORT_GUIDE, {socket: {prefix: this.prefix}})
		// Invalid target
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		// Returns if user trying to gift themselves.
		if (this.user.isSelf) return reply(this.locale.GIFT.SELF_TARGETING, {color: `red`})

		this.setSequence(5)
		this.fetching = await reply(this.locale.COMMAND.FETCHING, {
			simplified: true, 
			socket: {
				user: this.author.id,
				command: `gift`,
				emoji: emoji(`AAUloading`)
			}
		})

		const availableGifts = this.author.inventory.raw.filter(this.itemFilter)
		//  Handle if user don't have any gifts to send
		if (!availableGifts.length) {
			this.fetching.delete()
			return reply(this.locale.GIFT.UNAVAILABLE, {color: `red`})
		}

		this.setSequence(2)
		this.fetching.delete()
		this.displayAvailableGifts = await reply(this.displayGifts(availableGifts, emoji), {header: this.locale.GIFT.DISPLAYGIFT_HEADER})
		this.displayAvailableGiftsFooter = await reply(this.locale.GIFT.GUIDE_TO_PICK_GIFT, {simplified: true})
		this.sequence.on(`collect`, async msg => {
			const input = msg.content.toLowerCase()
			const params = input.split(` `)

			/** --------------------
			 *  Sequence Cancellations
			 *  --------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			const amountToSend = params[0].endsWith(`x`) ? trueInt(params[0].replace(/\x/g, ``)) : trueInt(params[0])
			// eslint-disable-next-line no-useless-escape
			const selectedItem = input.slice(input.indexOf(params[1]))
			const item = availableGifts.filter(key => (key.alias.toLowerCase() === selectedItem.replace(/\ /g, `_`))
				|| (key.name.toLowerCase === selectedItem)) [0]

			//  Handle if can't parse the desired user's gift amount
			if (!amountToSend) return reply(this.locale.GIFT.INVALID_AMOUNT, {color: `red`})
			//  Handle if selected item doesn't exists in the author/sender's inventory
			if (!item) return reply(this.locale.GIFT.INVALID_ITEM, {color: `red`})
			//  Handle if the amount to send is lower than total owned item
			if (item.quantity < amountToSend) return reply(this.locale.GIFT.INSUFFICIENT_AMOUNT, {
				socket: {item: `${emoji(item.alias)} (${commanifier(amountToSend-item.quantity)}x) ${item.name}`},
				color: `red`
			})

			await db.addUserReputation(amountToSend, this.user.id)
			await db.updateInventory({itemId: item.item_id, value: amountToSend, operation: `-`, userId: this.author.id})
			this.displayAvailableGifts.delete()
			this.displayAvailableGiftsFooter.delete()
			this.endSequence()
			return reply(this.locale.GIFT.SUCCESSFUL, {
				notch: true,
				thumbnail: avatar(this.user.id),
				color: `lightgreen`,
				socket: {
					user: name(this.user.id),
					gainedReps: amountToSend,
					item: `${emoji(item.alias)} (${commanifier(amountToSend)}x) ${item.name}`
				}
			})
		})
	}

	/**
	 * Prettify result from `this.author.inventory.row` into a readable list.
	 * @param {array} [inventory=[]] returned result from filtered `this.author.inventory.raw`
	 * @param {function} [emojiParser] refer to `Pistachio.emoji()`
	 * @retuns {string}
	 */
	displayGifts(inventory=[], emojiParser) {
		let str = `\n`
		for (let i = 0; i<inventory.length; i++) {
			const item = inventory[i]
			str += `${emojiParser(item.alias)} **(${item.quantity}x) ${item.name}**\n`
		}
		return str
	}
}

module.exports.help = {
	start: Gift,
	name: `gift`,
	aliases: [`gifts`, `giveitem`, `senditem`, `praise`],
	description: `Send gifts to your friends! They will receive 1 reputation point for each gift you send.`,
	usage: `gift <User>`,
	group: `Social`,
	permissionLevel: 0,
	multiUser: true
}