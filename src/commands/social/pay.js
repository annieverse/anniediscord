const Command = require(`../../libs/commands`)
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
		this.requirementLevel = 5
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, commanifier, trueInt, avatar, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)

		//  Returns if user level is below the requirement
		if (this.author.exp.level < this.requirementLevel) return reply(this.locale.PAY.LVL_TOO_LOW, {
			socket: {level: this.requirement_level},
			color: `red`
		})
		//  Displays as guide if user doesn't specify any parameter
		if (!this.fullArgs) return reply(this.locale.PAY.SHORT_GUIDE)
		//  Handle if target is invalid
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		//  Handle if user is trying to pay themselves
		if (this.user.isSelf) return reply(this.locale.PAY.SELF_TARGETING, {socket: {emoji: emoji(`AnnieMad`)}, color: `red`})

		this.setSequence(5)
		reply(this.locale.PAY.USER_CONFIRMATION, {socket: {user: name(this.user.id)}, color: `golden`})
		.then(init => {
			this.sequence.on(`collect`, async msg => {			
				let input = msg.content.toLowerCase()

				/** --------------------
				 *  Sequence Cancellations
				 *  --------------------
				 */
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(this.locale.ACTION_CANCELLED)
				}

				/** --------------------
				 *  1.) Amount to send
				 *  --------------------
				 */
				if (this.onSequence <= 1) {
					this.amount = trueInt(input)
					//  Handle if input is not a valid number
					if (!this.amount) return reply(this.locale.PAY.INVALID_AMOUNT, {color: `red`})
					//  Handle if sender's balance is below the specified input
					if (this.author.inventory.artcoins < this.amount) {
							this.endSequence()
							return reply(this.locale.PAY.INSUFFICIENT_BALANCE, {
							socket: {amount: `${emoji(`artcoins`)} ${commanifier(this.amount - this.author.inventory.artcoins)}`},
							color: `red`
						})
					}
					
					init.delete()
					reply(this.locale.PAY.CONFIRMATION, {
						socket: {
							emoji: emoji(`artcoins`),
							amount: commanifier(this.amount),
							user: name(this.user.id)
						},
						color: `golden`,
						notch: true,
						thumbnail: avatar(this.user.id)
					})				
					return this.nextSequence()
				}

				/** --------------------
				 *  2.) Finalizer
				 *  --------------------
				 */
				if (this.onSequence <= 2) {
					//  Silently ghosting if user's confirmation message is invalid
					if (!input.startsWith(`y`)) return
					await db.updateInventory({itemId: 52, value: this.amount, operation: `+`, userId: this.user.id, guildId: this.message.guild.id})
					await db.updateInventory({itemId: 52, value: this.amount, operation: `-`, userId: this.author.id, guildId: this.message.guild.id})
					msg.delete()
					reply(this.locale.PAY.SUCCESSFUL, {color: `lightgreen`})
					return this.endSequence()
				}
			})
		})
	}
}

module.exports.help = {
	start: Pay,
	name: `pay`,
	aliases: [`pay`, `transfer`, `transfers`, `share`],
	description: `Share artcoins with your friends!`,
	usage: `pay <User>`,
	group: `Social`,
	permissionLevel: 0,
	multiUser: true
}