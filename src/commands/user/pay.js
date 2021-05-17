const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/pay`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
/**
 * Share artcoins with your friends!
 * @author klerikdust
 */
class Pay extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		/**
		 * Minimum level in order to use the feature
		 * @type {number|float}
		 */
		this.requirementLevel = 3
		/**
		 * Tax rate to be deducted from sender's balance
		 * @type {number|float}
		 */
		this.tax = 0.02
		/**
		 * Maximum allowed amount for each transaction
		 * @type {number}
		 */
		this.maxAllowed = 999999
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		//  Returns if user level is below the requirement
		if (this.author.exp.level < this.requirementLevel) return this.reply(this.locale.PAY.LVL_TOO_LOW, {status: `warn`, socket: {level: this.requirementLevel}})
		//  Displays as guide if user doesn't specify any parameter
		if (!this.fullArgs) return this.reply(this.locale.PAY.SHORT_GUIDE, {
			header: `Hi, ${this.author.master.username}`,
			image: `banner_pay`,
			socket: {prefix: this.bot.prefix}
		})
		//  Handle if target is invalid
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		//  Handle if user is trying to pay themselves
		if (this.user.master.id === this.message.author.id) return this.reply(this.locale.PAY.SELF_TARGETING, {socket: {emoji: await this.bot.getEmoji(`692428748838010970`)}})
		//  Parse amount of artcoins to be send
		const amountToSend = this.fullArgs.replace(/\D/g, ``)
		//  Handle if user not specifying the amount to send
		if (!amountToSend) return this.reply(this.locale.PAY.INVALID_AMOUNT) 
		//  Handle if user isn't inputting valid amount to send
		if (!trueInt(amountToSend)) return this.reply(this.locale.PAY.INVALID_NUMBER)
		//  Handle if user inputted amount to send way above limit.
		if (amountToSend > this.maxAllowed) return this.reply(this.locale.PAY.EXCEEDING_LIMIT, {socket:{limit: commanifier(this.maxAllowed)} })
		//  Parse amount of tax to be deducted from the transaction
		const amountOfTax = amountToSend * this.tax
		const total = Math.round(amountToSend - amountOfTax)
		//  Render confirmation
		const confirmation = await this.reply(this.locale.PAY.USER_CONFIRMATION, {
			prebuffer: true,
			image: await new GUI(this.user, total).build(),
			socket: {
				user: this.user.master.username,
				amount: `${await this.bot.getEmoji(`758720612087627787`)} ${commanifier(total)}`
			}
		})
		await this.addConfirmationButton(`checkout`, confirmation)
 		return this.confirmationButtons.get(`checkout`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            //  Handle if user trying to send artcoins above the amount they had
            if (this.author.inventory.artcoins < amountToSend) return this.reply(this.locale.PAY.INSUFFICIENT_BALANCE)
 			//  Send artcoins to target user
			this.bot.db.updateInventory({itemId: 52, value: this.total, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
			//  Deduct artcoins from sender's balance
			this.bot.db.updateInventory({itemId: 52, value: this.amountToSend, operation: `-`, userId: this.author.master.id, guildId: this.message.guild.id})
 			this.finalizeConfirmation(r)
 			this.reply(``, {
 				customHeader: [`${this.user.master.username} has received your artcoins!♡`, this.user.master.displayAvatarURL()],
 				socket:{target: this.user.master.username} 
 			})
 		})
 	}
}

module.exports.help = {
	start: Pay,
	name: `pay`,
	aliases: [`pay`, `transfer`, `transfers`, `share`, `give`],
	description: `Share artcoins with your friends!`,
	usage: `pay <User>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}
