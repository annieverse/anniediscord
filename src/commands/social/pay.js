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
    async execute({ reply, emoji, name, commanifier, trueInt, avatar, bot:{db, locale:{PAY}} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorData(2)

		//  Returns if user level is below the requirement
		if (this.author.exp.level < this.requirementLevel) return reply(PAY.LVL_TOO_LOW, {
			socket: [this.requirement_level],
			color: `red`
		})
		//  Returns as guide user doesn't specify any parameter
		if (!this.fullArgs) return reply(PAY.SHORT_GUIDE)
		//  Returns if target is invalid
		if (!this.user) return reply(PAY.INVALID_USER, {color: `red`})
		//  Returns if user trying to pay themselves
		if (this.user.isSelf) return reply(PAY.SELF_TARGETING, {color: `red`})

		//  Receives 5 new responses in current sequence
		this.setSequence(5)

		let amount = 0
		reply(PAY.USER_CONFIRMATION, {socket: [name(this.user.id)], color: `golden`})
		.then(initial => {
			this.sequence.on(`collect`, async msg => {			
				let input = msg.content.toLowerCase()
				msg.delete()

				//  Returns if user asked to cancel the transaction
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(PAY.CANCELLED)
				}

				/** --------------------
				 *  1.) Amount to send - Confirmation
				 *  --------------------
				 */
				if (this.onSequence <= 1) {
					amount = trueInt(input)
					//  Returns if input is invalid
					if (!amount) return reply(PAY.INVALID_AMOUNT, {color: `red`})
					//  Returns if sender's balance is below the specified input
					if (this.author.inventory.artcoins < amount) return reply(PAY.EXCEEDING_BALANCE, {color: `red`})
					
					initial.delete()
					reply(PAY.CONFIRMATION, {
						socket: [emoji(`artcoins`), commanifier(amount), name(this.user.id)],
						color: `golden`,
						notch: true,
						thumbnail: avatar(this.user.id)
					})				
					return this.nextSequence()
				}

				/** --------------------
				 *  2.) Finalizer - Confirmation
				 *  --------------------
				 */
				if (this.onSequence <= 2) {
					if (!input.startsWith(`y`)) return

					//  Database update
					await db.updateInventory({itemId: 52, value: amount, operation: `+`, userId: this.user.id})
					await db.updateInventory({itemId: 52, value: amount, operation: `-`, userId: this.author.id})

					//  Transaction successful
					reply(PAY.SUCCESSFUL, {color: `lightgreen`})
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