const Command = require(`../../libs/commands`)
const inventoryGUI = require(`../../ui/prebuild/inventory`)
const giftGUI = require(`../../ui/prebuild/gift`)
const stringSimilarity = require(`string-similarity`)
const commanifier = require(`../../utils/commanifier`)
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
     * @return {void}
     */
    async execute() {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		const availableGifts = this.author.inventory.raw.filter(this.itemFilter)
		this.author.inventory.raw = availableGifts
		//  Handle if user don't have any gifts to send
		if (!availableGifts.length) return this.reply(this.locale.GIFT.UNAVAILABLE, {
			socket: {
				prefix: this.bot.prefix,
				emoji: await this.bot.getEmoji(`692428927620087850`)
			}
		})
		// Handle if user doesn't specify anything
		if (!this.fullArgs) {
			const loading = await this.reply(this.locale.GIFT.RENDERING_AVAILABLE_GIFTS, {simplified: true, socket: {emoji: await this.bot.getEmoji(`790994076257353779`) }})
			await this.reply(this.locale.GIFT.SHORT_GUIDE, {
				prebuffer: true,
				image: (await new inventoryGUI(this.author, this.bot).build()).toBuffer(),
				socket: {
					prefix: this.prefix,
					referenceItem: availableGifts[0].name.toLowerCase(),
					items: await this.displayGifts(availableGifts, ...arguments)
				}
			})
			return loading.delete()
		}
		// Invalid target
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		// Returns if user trying to gift themselves.
		if (this.user.isSelf) return this.reply(this.locale.GIFT.SELF_TARGETING, {socket: {emoji: await this.bot.getEmoji(`790338393015713812`)} })
		//  Handle if the specified gift cannot be found
		let searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, availableGifts.map(i => i.name))
		const gift = searchStringResult.bestMatch.rating >= 0.2 ? availableGifts.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
		if (!gift) return this.reply(this.locale.GIFT.MISSING_ITEM, {
			socket: {example:`e.g. **\`${this.bot.prefix}gift ${this.user.master.username} 10 ${availableGifts[0].name.toLowerCase()}\`**`}
		})
		//  Handle if can't parse the desired user's gift amount
		const amount = this.fullArgs.replace(/\D/g, ``)
		if (!amount) return this.reply(this.locale.GIFT.INVALID_AMOUNT, {
			socket: {
				gift: gift.name,
				example: `e.g. **\`${this.bot.prefix}gift ${this.user.master.username} 10 ${gift.name.toLowerCase()}\`**`
			}
		})
		//  Render confirmation
	    const confirmation = await this.reply(this.locale.GIFT.CONFIRMATION, {
			prebuffer: true,
			image: await new giftGUI(this.user, gift, amount).build(),
			socket: {
				user: this.user.master.username,
				gift: `${await this.bot.getEmoji(gift.alias)} ${gift.name}`,
				amount: commanifier(amount)
			}
		})
		await this.addConfirmationButton(`gift`, confirmation)
 		return this.confirmationButtons.get(`gift`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            //  Handle if the amount to send is lower than total owned item
            if (gift.quantity < amount) return this.reply(this.locale.GIFT.INSUFFICIENT_AMOUNT, {
                socket: {
                    gift: `${await this.getEmoji(gift.alias)} ${commanifier(gift.quantity)}x ${gift.name}`,
                    emoji: await this.bot.getEmoji(`692428613122785281`)
                }
            })
			//  Adds reputation point to target user
			this.bot.db.addUserReputation(amount, this.user.master.id, this.message.author.id, this.message.guild.id)
			//  Deduct gifts from sender
			this.bot.db.updateInventory({itemId: gift.item_id, value: amount, operation: `-`, userId: this.author.master.id, guildId: this.message.guild.id})
 			this.finalizeConfirmation(r)
 			this.reply(``, {
				customHeader: [`${this.user.master.username} has received your gifts!♡`, this.user.master.displayAvatarURL()],
				socket: {
					user: this.user.master.username,
					gift: `${await this.bot.getEmoji(gift.alias)} ${commanifier(amount)}x ${gift.name}!`
				} 
			})
 		})
	}

	/**
	 * Prettify result from `this.author.inventory.row` into a readable list.
	 * @param {array} [inventory=[]] returned result from filtered `this.author.inventory.raw`
	 * @retuns {string}
	 */
	async displayGifts(inventory=[]) {
		let str = ``
		for (let i = 0; i<inventory.length; i++) {
			const item = inventory[i]
			str += `• ${await this.bot.getEmoji(item.alias)} ${commanifier(item.quantity)}x ${item.name}`
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
