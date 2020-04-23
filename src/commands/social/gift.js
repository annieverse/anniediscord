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
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, trueInt, bot:{db, locale:{GIFT}} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorData(2)

		// No parameters given
		if (!this.fullArgs) return reply(GIFT.SHORT_GUIDE, {socket: [emoji(`HeartPeek`)]})
		// Invalid target
		if (!this.user) return reply(GIFT.INVALID_USER, {color: `red`})
		// Returns if user trying to gift themselves.
		if (this.user.isSelf) return reply(GIFT.SELF_TARGETING, {color: `red`})

		this.setSequence(5)
	
		reply(GIFT.FETCHING, {simplified: true, socket:[this.user.id]})
		.then(async load => {
			let availableGifts = this.author.inventory.raw.filter(key => (key.type === `GIFTS`) && (key.quantity != 0))
			load.delete()
			//  Handle if user don't have any gifts to send
			if (!availableGifts) return reply(GIFT.UNAVAILABLE, {color: `red`})
			//  Selecting gift
			reply(this.displayGifts(availableGifts, emoji))
			reply(GIFT.GUIDE_TO_PICK_GIFT, {color: `golden`})
			.then(async guide => {
				this.sequence.on(`collect`, async msg => {
					guide.delete()
					const input = msg.content.toLowerCase()
					const params = input.split(` `)
					msg.delete()

					//  Returns if user asked to cancel the transaction
					if (this.cancelParameters.includes(input)) {
						this.endSequence()
						return reply(GIFT.CANCELLED)
					}

					//  Get amount of gift to send from first parameter
					const amountToSend = trueInt(params[0])
					//  Get item name from the second parameter. Ignoring spaces.
					// eslint-disable-next-line no-useless-escape
					const selectedItem = input.slice(input.indexOf(params[1])).replace(/\ /g, `_`)
					const item = availableGifts.filter(key => (key.alias === selectedItem) || (key.name === selectedItem))

					//  Handle if can't parse the desired user's gift amount
					if (!amountToSend) return reply(GIFT.INVALID_AMOUNT, {color: `red`})
					//  Handle if selected item doesn't exists in the author/sender's inventory
					if (!item.length) return reply(GIFT.INVALID_ITEM, {color: `red`})
					//  Returns if the amount to send is lower than total owned items
					if (item[0].quantity < amountToSend) return reply(GIFT.INSUFFICIENT_AMOUNT, {
						socket: [amountToSend - item[0].quantity, emoji(item[0].alias), item[0].name],
						color:` red`
					})

					await db.addUserReputation(amountToSend, this.user.id)
					await db.updateInventory({itemId: item[0].item_id, value: amountToSend, operation: `-`, userId: this.author.id})
					reply(GIFT.SUCCESSFUL, {
						socket: [
							name(this.user.id),
							emoji(selectedItem),
							amountToSend,
							item[0].name,
							amountToSend,
							name(this.author.id)
						],
						color: `lightgreen`
					})
					return this.endSequence()
				})
			})
		})
	}

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