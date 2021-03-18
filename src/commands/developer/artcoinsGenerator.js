const Command = require(`../../libs/commands`)

/**
 * Adds artcoins to a user
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
	async execute({ reply, bot:{db}, name, avatar, trueInt, emoji, commanifier }) {
		await this.requestUserMetadata(2)

		//  Handle if user doesn't specify any arg
		if (!this.fullArgs) return reply(this.locale.ADDAC.GUIDE)
		//  Handle if target user is invalid
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		this.setSequence(5)

		let amount = 0
		reply(this.locale.ADDAC.CONFIRMATION_SEQ_1, {socket: {user: name(this.user.master.id)}, color: `golden`})
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
					return reply(this.locale.ACTION_CANCELLED)
				}

				/**
				 * ---------------------
				 * 1.) Inputting amount of artcoins to be generated.
				 * ---------------------
				 */
				if (this.onSequence <= 1) {
					amount = trueInt(input)
					if (!amount) return reply(this.locale.ADDAC.NO_NEGATIVE_INPUT)
					confirmation.delete()
					reply(this.locale.ADDAC.CONFIRMATION_SEQ_2, {
						socket: {
							emoji: await emoji(`758720612087627787`),
							amount: commanifier(amount),
							user: name(this.user.master.id)
						},
						thumbnail: avatar(this.user.master.id),
						notch: true,
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
					await db.updateInventory({itemId: 52, value: amount, userId: this.user.master.id, guildId: this.message.guild.id})
					reply(this.locale.ADDAC.SUCCESSFUL, {color: `lightgreen`})
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
	description: `Adds artcoins to a user`,
	usage: `addac <User>(Optional)`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true
}