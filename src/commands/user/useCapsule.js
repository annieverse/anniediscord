const Command = require(`../../libs/commands`)
const Experience = require(`../../libs/exp`)
/**
 * Eats the capsules you get from gacha and gives you EXP in return
 * @author klerikdust
 */
class UseCapsule extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		this.gainedExp = 150
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji, avatar, commanifier, name, trueInt, bot:{db} }) {
		await this.requestUserMetadata(2)

		const capsules = this.user.inventory.power_capsules
		//  Returns if user doesn't have any capsule to use.
		if (!capsules) return reply(this.locale.EAT_POWERCAPSULE.UNAVAILABLE, {color: `red`})
		//  Handle if user doesn't input the argument
		if (!this.fullArgs) return reply(this.locale.EAT_POWERCAPSULE.MISSING_ARG)
		//  Handle if user number input is an invalid number.
		let amount = trueInt(this.fullArgs)
		if (!amount) return reply(this.locale.EAT_POWERCAPSULE.INVALID_AMOUNT, {color: `red`})
		//  Returns if owned capsule is lower than the amount of going to be used
		if (capsules < amount) return reply(this.locale.EAT_POWERCAPSULE.INSUFFICIENT_AMOUNT, {
			color: `red`,
			socket: {
				emoji: emoji(`power_capsule`), 
				amount: commanifier(capsules)
			}
		})

		let totalGainedExp = amount * this.gainedExp
		this.setSequence()

		//  Confirmation
		this.confirmation = await reply(this.locale.EAT_POWERCAPSULE.CONFIRMATION, {
			color: `golden`,
			notch: true,
			thumbnail: avatar(this.user.id),
			socket: {
				emoji: emoji(`power_capsule`),
				powerCapsuleAmount: commanifier(amount),
				gainedExp: commanifier(totalGainedExp)
			}
		})
		this.sequence.on(`collect`, async msg => {
			let input = msg.content.toLowerCase()

			//  Returns if user asked to cancel the transaction
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				msg.delete()
				return reply(this.locale.ACTION_CANCELLED)
			}

			//  Silent ghosting
			if (!input.startsWith(`y`)) return
			msg.delete()

			//  Deduct item & adds new experience points
			this.confirmation.delete()
			await db.updateInventory({itemId: 70, value: amount, operation:`-`, userId: this.user.id, guildId:this.message.guild.id})
			await new Experience({bot:this.bot, message:this.message}).execute(totalGainedExp)
			reply(this.locale.EAT_POWERCAPSULE.SUCCESSFUL, {
				socket: {
					user: name(this.user.id),
					emoji: emoji(`power_capsule`),
					amount: commanifier(amount),
					gainedExp: commanifier(totalGainedExp)
				},
				color: `lightgreen`
			})
			return this.endSequence()		
		})
	}
}

module.exports.help = {
	start: UseCapsule,
	name: `useCapsule`,
	aliases: [`eatcapsule`, `capsuleeat`, `usecapsule`],
	description: `Eats the capsules you get from gacha and gives you EXP in return`,
	usage: `usecapsule <Amount>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}
