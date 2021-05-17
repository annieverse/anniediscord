const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/sellFragment`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
/**
 * Exchange all your unused fragments into artcoins!
 * @author klerikdust
 */
class SellFragments extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)

		/**
		 * Minimum amount of fragment that allowed to sell
		 * @type {number}
		 */
		this.minimumToSell = 5

		/**
		 * Fragment to Artcoins's conversion rate
		 * @type {number}
		 */
		this.rate = 5
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
    	await this.requestUserMetadata(2)
    	//  Display guild if user doesn't specify any arg
    	if (!this.fullArgs) return this.reply(this.locale.SELLFRAGMENTS.GUIDE, {
    		header: `Hi, ${this.user.master.username}!`,
    		image: `banner_sellfragments`,
    		socket: {
    			prefix: this.bot.prefix,
    			emoji: await this.bot.getEmoji(`700731914801250324`),
    			emojiFragment: await this.bot.getEmoji(`577121735917174785`),
    			rate: `${this.rate}:1`,
    			min: this.minimumToSell
    		}
    	})
    	//  Handle if user doesn't have any fragments in their inventory
    	if (!this.user.inventory.fragments) return this.reply(this.locale.SELLFRAGMENTS.EMPTY_FRAGMENTS, {
    		socket: {emoji: await this.bot.getEmoji(`692428748838010970`)},
    	})
    	//  Handle if user specified an invalid amount
    	const amountToSell = this.args[0].startsWith(`all`) ? this.user.inventory.fragments : trueInt(this.args[0])
    	if (!amountToSell) return this.reply(this.locale.SELLFRAGMENTS.INVALID_AMOUNT)
    	//  Handle if user's specified amount is lower than the minimum sell 
    	if (amountToSell < this.minimumToSell) return this.reply(this.locale.SELLFRAGMENTS.AMOUNT_TOO_LOW, {
    		socket: {
    			amount: this.minimumToSell,
    			emoji: await this.bot.getEmoji(`692428748838010970`)
    		}
    	})
    	//  Calculate amount to receive
    	const receivedAmount = Math.floor(amountToSell / this.rate)
    	//  Confirmation
    	const confirmation = await this.reply(this.locale.SELLFRAGMENTS.CONFIRMATION, {
    		prebuffer: true,
    		image: await new GUI(this.user, receivedAmount).build(),
    		socket: {
    			fragmentsAmount: commanifier(amountToSell),
    			artcoinsAmount: commanifier(receivedAmount),
    			fragmentsEmoji: await this.bot.getEmoji(`577121735917174785`),
    			artcoinsEmoji: await this.bot.getEmoji(`758720612087627787`) 
    		}
    	})
    	await this.addConfirmationButton(`SELLFRAGMENTS_CONFIRMATION`, confirmation, this.user.master.id)
    	this.confirmationButtons.get(`SELLFRAGMENTS_CONFIRMATION`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            //  Prevent user from selling over the amount of their owned fragments
            if (amountToSell > this.user.inventory.fragments) return this.reply(this.locale.SELLFRAGMENTS.INVALID_AMOUNT)
    		//  Deliver artcoins to user's inventory
    		this.bot.db.updateInventory({itemId: 52, userId: this.user.master.id, guildId: this.message.guild.id, value: receivedAmount, operation: `+`})
    		//  Deduct fragments from user's inventory
    	    this.bot.db.updateInventory({itemId: 51, userId: this.user.master.id, guildId: this.message.guild.id, value: amountToSell, operation: `-`})
    		//  Successful
            this.finalizeConfirmation(r)
    		return this.reply(``, {customHeader: [`Fragments has been sold!`, this.user.master.displayAvatarURL()]}) 
    	})
	}
}

module.exports.help = {
	start: SellFragments,
	name: `sellFragments`,
	aliases: [`sellfrag`, `sellfragments`, `sellfrags`, `sellfragment`],
	description: `Exchange all your unused fragments into artcoins!`,
	usage: `sellfragments <amount/all>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false,
    invisible: true
}
