const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/sellFragment`)
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

		/**
		 * Source URL for SellFragment's Guide Banner
		 * @type {string}
		 */
		this.banner = `https://user-images.githubusercontent.com/42025692/95013847-2b255180-066d-11eb-98c9-f397ab9d7e7f.jpg`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, trueInt, avatar, commanifier, name }) {
    	await this.requestUserMetadata(2)
    	//  Display guild if user doesn't specify any arg
    	if (!this.fullArgs) return reply(this.locale.SELLFRAGMENTS.GUIDE, {
    		header: `Hi, ${name(this.user.id)}!`,
    		color: `crimson`,
    		image: this.banner,
    		prebuffer: true,
    		socket: {
    			prefix: this.bot.prefix,
    			emoji: emoji(`AnniePogg`),
    			emojiFragment: emoji(`fragments`),
    			rate: `${this.rate}:1`,
    			min: this.minimumToSell
    		}
    	})
    	//  Handle if user doesn't have any fragments in their inventory
    	if (!this.user.inventory.fragments) return reply(this.locale.SELLFRAGMENTS.EMPTY_FRAGMENTS, {
    		socket: {emoji: emoji(`AnnieMad`)},
    	})
    	//  Handle if user specified an invalid amount
    	this.amountToSell = this.args[0].startsWith(`all`) ? this.user.inventory.fragments : trueInt(this.args[0])
    	if (!this.amountToSell) return reply(this.locale.SELLFRAGMENTS.INVALID_AMOUNT)
    	//  Handle if user's specified amount is lower than the minimum sell 
    	if (this.amountToSell < this.minimumToSell) return reply(this.locale.SELLFRAGMENTS.AMOUNT_TOO_LOW, {
    		socket: {
    			amount: this.minimumToSell,
    			emoji: emoji(`fragments`)
    		}
    	})
    	//  Calculate amount to receive
    	this.receivedAmount = Math.floor(this.amountToSell / this.rate)
    	//  Confirmation
    	this.confirmation = await reply(this.locale.SELLFRAGMENTS.CONFIRMATION, {
    		prebuffer: true,
    		image: await new GUI(this.user, this.receivedAmount).build(),
    		socket: {
    			fragmentsAmount: commanifier(this.amountToSell),
    			artcoinsAmount: commanifier(this.receivedAmount),
    			fragmentsEmoji: emoji(`fragments`),
    			artcoinsEmoji: emoji(`artcoins`) 
    		}
    	})
    	this.addConfirmationButton(`SELLFRAGMENTS_CONFIRMATION`, this.confirmation, this.user.id)
    	this.confirmationButtons.get(`SELLFRAGMENTS_CONFIRMATION`).on(`collect`, async msg => {
    		//  Deliver artcoins to user's inventory
    		await this.bot.db.updateInventory({itemId: 52, userId: this.user.id, guildId: this.message.guild.id, value: this.receivedAmount, operation: `+`})
    		//  Deduct fragments from user's inventory
    		await this.bot.db.updateInventory({itemId: 51, userId: this.user.id, guildId: this.message.guild.id, value: this.amountToSell, operation: `-`})
    		//  Successful
            this.finalizeConfirmation(msg)
    		return reply(``, {customHeader: [`Fragments has been sold!`, avatar(this.user.id)]})
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