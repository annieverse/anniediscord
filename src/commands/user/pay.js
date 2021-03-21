const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/pay`)
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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, commanifier, trueInt, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		//  Returns if user level is below the requirement
		if (this.author.exp.level < this.requirementLevel) return reply(this.locale.PAY.LVL_TOO_LOW, {status: `warn`, socket: {level: this.requirementLevel}})
		//  Displays as guide if user doesn't specify any parameter
		if (!this.fullArgs) return reply(this.locale.PAY.SHORT_GUIDE, {
			color: `crimson`,
			header: `Hi, ${this.author.master.username}`,
			image: `banner_pay`,
			socket: {prefix: this.bot.prefix}
		})
		//  Handle if target is invalid
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {status: `fail`})
		//  Handle if user is trying to pay themselves
		if (this.user.isSelf) return reply(this.locale.PAY.SELF_TARGETING, {socket: {emoji: await emoji(`692428748838010970`)}, color: `red`})
		//  Parse amount of artcoins to be send
		console.debug(this.fullArgs)
		this.amountToSend = this.fullArgs.replace(/\D/g, ``)
		//  Handle if user not specifying the amount to send
		if (!this.amountToSend) return reply(this.locale.PAY.INVALID_AMOUNT, {status: `fail`})
		//  Handle if user isn't inputting valid amount to send
		if (!trueInt(this.amountToSend)) return reply(this.locale.PAY.INVALID_NUMBER, {status: `fail`})
		//  Handle if user inputted amount to send way above limit.
		if (this.amountToSend > this.maxAllowed) return reply(this.locale.PAY.EXCEEDING_LIMIT, {status: `warn`, socket:{limit: commanifier(this.maxAllowed)} })
		//  Handle if user trying to send artcoins above the amount they had
		if (this.author.inventory.artcoins < this.amountToSend) return reply(this.locale.PAY.INSUFFICIENT_BALANCE, {status: `warn`})
		//  Parse amount of tax to be deducted from the transaction
		this.amountOfTax = this.amountToSend * this.tax
		this.total = Math.round(this.amountToSend - this.amountOfTax)
		//  Render confirmation
		this.confirmation = await reply(this.locale.PAY.USER_CONFIRMATION, {
			prebuffer: true,
			image: await new GUI(this.user, this.total).build(),
			socket: {
				user: name(this.user.master.id),
				amount: `${await emoji(`758720612087627787`)} ${commanifier(this.total)}`
			}
		})
		await this.addConfirmationButton(`checkout`, this.confirmation)
 		return this.confirmationButtons.get(`checkout`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
 			//  Send artcoins to target user
			await db.updateInventory({itemId: 52, value: this.total, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
			//  Deduct artcoins from sender's balance
			await db.updateInventory({itemId: 52, value: this.amountToSend, operation: `-`, userId: this.author.master.id, guildId: this.message.guild.id})
 			this.finalizeConfirmation(r)
 			reply(``, {
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