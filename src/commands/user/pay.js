const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/pay`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)
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
    async execute({ reply, emoji, name, commanifier, trueInt, avatar, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		//  Returns if user level is below the requirement
		if (this.author.exp.level < this.requirementLevel) return reply(this.locale.PAY.LVL_TOO_LOW, {status: `warn`, socket: {level: this.requirementLevel}})
		//  Displays as guide if user doesn't specify any parameter
		if (!this.fullArgs) return reply(this.locale.PAY.SHORT_GUIDE, {
			color: `crimson`,
			header: `Hi, ${name(this.author.id)}`,
			image: `banner_pay`,
			socket: {prefix: this.bot.prefix}
		})
		//  Handle if target is invalid
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {status: `fail`})
		//  Handle if user is trying to pay themselves
		if (this.user.isSelf) return reply(this.locale.PAY.SELF_TARGETING, {socket: {emoji: emoji(`AnnieMad`)}, color: `red`})
		//  Parse amount of artcoins to be send
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
				user: name(this.user.id),
				amount: `${emoji(`artcoins`)} ${commanifier(this.total)}`
			}
		})
		this.addConfirmationButton(`checkout`, this.confirmation)
 		return this.confirmationButtons.get(`checkout`).on(`collect`, async r => {
 			//  Send artcoins to target user
			await db.updateInventory({itemId: 52, value: this.total, operation: `+`, userId: this.user.id, guildId: this.message.guild.id})
			//  Deduct artcoins from sender's balance
			await db.updateInventory({itemId: 52, value: this.amountToSend, operation: `-`, userId: this.author.id, guildId: this.message.guild.id})
 			this.finalizeConfirmation(r)
 			reply(``, {
 				customHeader: [`${name(this.user.id)} has received your artcoins!♡`, avatar(this.user.id)],
 				socket:{target: name(this.user.id)} 
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