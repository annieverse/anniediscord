const Command = require(`../../libs/commands`)
const inventoryGUI = require(`../../ui/prebuild/inventory`)
const giftGUI = require(`../../ui/prebuild/gift`)
const stringSimilarity = require(`string-similarity`)
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
		this.itemFilter = item => (item.type_id === 10) && (item.quantity > 0)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, avatar, commanifier, name, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		const availableGifts = this.author.inventory.raw.filter(this.itemFilter)
		this.author.inventory.raw = availableGifts
		//  Handle if user don't have any gifts to send
		if (!availableGifts.length) return reply(this.locale.GIFT.UNAVAILABLE, {
			socket: {
				prefix: this.bot.prefix,
				emoji: emoji(`AnnieSmile`)
			}
		})
		// Handle if user doesn't specify anything
		if (!this.fullArgs) {
			this.loading = await reply(this.locale.GIFT.RENDERING_AVAILABLE_GIFTS, {simplified: true, socket: {emoji:emoji(`AAUloading`) }})
			await reply(this.locale.GIFT.SHORT_GUIDE, {
				prebuffer: true,
				image: (await new inventoryGUI(this.author, this.bot).build()).toBuffer(),
				socket: {
					prefix: this.prefix,
					referenceItem: availableGifts[0].name.toLowerCase(),
					items: this.displayGifts(availableGifts, ...arguments)
				}
			})
			return this.loading.delete()
		}
		// Invalid target
		if (!this.user) return reply(this.locale.USER.IS_INVALID)
		// Returns if user trying to gift themselves.
		if (this.user.isSelf) return reply(this.locale.GIFT.SELF_TARGETING, {socket: {emoji:emoji(`AnnieYandere`)} })
		//  Handle if the specified gift cannot be found
		let searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, availableGifts.map(i => i.name))
		const gift = searchStringResult.bestMatch.rating >= 0.2 ? availableGifts.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
		if (!gift) return reply(this.locale.GIFT.MISSING_ITEM, {
			socket: {example:`e.g. **\`${this.bot.prefix}gift ${this.user.username} 10 ${availableGifts[0].name.toLowerCase()}\`**`}
		})
		//  Handle if can't parse the desired user's gift amount
		const amount = this.fullArgs.replace(/\D/g, ``)
		if (!amount) return reply(this.locale.GIFT.INVALID_AMOUNT, {
			socket: {
				gift: gift.name,
				example: `e.g. **\`${this.bot.prefix}gift ${this.user.username} 10 ${gift.name.toLowerCase()}\`**`
			}
		})
		//  Handle if the amount to send is lower than total owned item
		if (gift.quantity < amount) return reply(this.locale.GIFT.INSUFFICIENT_AMOUNT, {
			socket: {
				gift: `${emoji(gift.alias)} ${commanifier(gift.quantity)}x ${gift.name}`,
				emoji: emoji(`AnnieDead`)
			}
		})
		//  Render confirmation
		this.confirmation = await reply(this.locale.GIFT.CONFIRMATION, {
			prebuffer: true,
			image: await new giftGUI(this.user, gift, amount).build(),
			socket: {
				user: name(this.user.id),
				gift: `${emoji(gift.alias)} ${gift.name}`,
				amount: commanifier(amount)
			}
		})
		this.addConfirmationButton(`gift`, this.confirmation)
 		return this.confirmationButtons.get(`gift`).on(`collect`, async r => {
			//  Adds reputation point to target user
			await db.addUserReputation(amount, this.user.id, this.message.author.id, this.message.guild.id)
			//  Deduct gifts from sender
			await db.updateInventory({itemId: gift.item_id, value: amount, operation: `-`, userId: this.author.id, guildId: this.message.guild.id})
 			this.finalizeConfirmation(r)
 			reply(``, {
				customHeader: [`${name(this.user.id)} has received your gifts!♡`, avatar(this.user.id), ],
				socket: {
					user: name(this.user.id),
					gift: `${emoji(gift.alias)} ${commanifier(amount)}x ${gift.name}!`
				} 
			})
 		})
	}

	/**
	 * Prettify result from `this.author.inventory.row` into a readable list.
	 * @param {array} [inventory=[]] returned result from filtered `this.author.inventory.raw`
	 * @param {function} [tools] 
	 * @retuns {string}
	 */
	displayGifts(inventory=[], tools) {
		let str = ``
		for (let i = 0; i<inventory.length; i++) {
			const item = inventory[i]
			str += `• ${tools.emoji(item.alias)} ${tools.commanifier(item.quantity)}x ${item.name}`
			if (i != (inventory.length-1)) str += `\n`
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
	group: `User`,
	permissionLevel: 0,
	multiUser: true,
}