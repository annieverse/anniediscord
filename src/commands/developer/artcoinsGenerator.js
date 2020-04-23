const Command = require(`../../libs/commands`)

/**
 * Add artcoins to a user
 * @author klerikdust
 */
class ArtcoinsGenerator extends Command {

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
	async execute({ reply, bot:{locale:{ADDAC}, db}, name, trueInt, emoji, commanifier }) {
		await this.requestUserMetadata(2)

		//  Handle if user doesn't specify any arg
		if (!this.fullArgs) return reply(ADDAC.GUIDE)
		//  Handle if target user is invalid
		if (!this.user) return reply(ADDAC.INVALID_USER, {color: `red`})

		this.setSequence(5)

		let amount = 0
		reply(ADDAC.CONFIRMATION_SEQ_1, {color: `golden`})
		.then(async confirmation => {
			this.sequence.on(`collect`, async msg => {
				let input = msg.content.toLowerCase()
				msg.delete()

				/**
				 * ---------------------
				 * Sequence Cancellations.
				 * ---------------------
				 */
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(ADDAC.CANCELLED)
				}

				/**
				 * ---------------------
				 * 1.) Inputting amount of artcoins to be generated.
				 * ---------------------
				 */
				if (this.onSequence <= 1) {
					amount = trueInt(input)
					//  Returns if input is a negative value
					if (!amount) return reply(ADDAC.NO_NEGATIVE_INPUT)
					confirmation.delete()
					reply(ADDAC.CONFIRMATION_SEQ_2, {
						socket: [emoji(`artcoins`), commanifier(amount), name(this.user.id)],
						color: `golden`
					})
					return this.nextSequence()
				}

				/**
				 * ---------------------
				 * 2.) Finalizer/Confirmation
				 * ---------------------
				 */
				if (this.onSequence <= 2) {
					//  Update
					await db.updateInventory({itemId: 52, value: amount, userId: this.user.id})
					reply(ADDAC.SUCCESSFUL, {
						socket: [
							name(this.user.id),
							emoji(`artcoins`),
							commanifier(amount)],
						color: `lightgreen`
					})
					return this.endSequence()
				}
			})
		})
	}
}


module.exports.help = {
	start: ArtcoinsGenerator,
	name: `artcoinsGenerator`,
	aliases: [`addac`, `addacs`, `addartcoin`],
	description: `Add artcoins to a user`,
	usage: `addac <User>(Optional)`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true
}