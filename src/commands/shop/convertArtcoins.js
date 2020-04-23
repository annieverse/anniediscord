const Command = require(`../../libs/commands`)
/**
 * Converts Artcoins into EXP at the rate of 2:1
 * @author klerikdust
 */
class ConvertArtcoins extends Command {

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
    async execute({ reply, emoji, name, trueInt, commanifier, avatar, bot:{db, locale:{CARTCOIN}} }) {
    	await this.requestUserMetadata(2)

		//  Returns as guide if user doesn't specify any parameters
		if (!this.args[0]) return reply(CARTCOIN.SHORT_GUIDE)
		const amountToUse = this.args[0].startsWith(`all`) ? this.user.inventory.artcoins : trueInt(this.args[0])
		//  Returns if user's artcoins is below the amount of going to be used
		if (this.user.inventory.artcoins < amountToUse) return reply(CARTCOIN.INSUFFICIENT_AMOUNT, {
			socket: [emoji(`artcoins`), commanifier(this.user.inventory.artcoins)],
			color: `red`
		})
		//  Returns if user amount input is below the acceptable threeshold
		if (!amountToUse || amountToUse < 2) return reply(CARTCOIN.INVALID_AMOUNT, {color: `red`})
		const totalGainedExp = amountToUse / 2

		this.setSequence(5)
		reply(CARTCOIN.CONFIRMATION, {
			thumbnail: avatar(this.user.id),
			color: `golden`,
			notch: true,
			socket: [emoji(`artcoins`), commanifier(amountToUse), commanifier(totalGainedExp)]})
		this.sequence.on(`collect`, async msg => {
			const input = msg.content.toLowerCase()
			msg.delete()

			//  Sequence Cancellations
			if (this.cancelParameters.includes(input)) {
				reply(CARTCOIN.CANCELLED)
				return this.endSequence()
			}
			//  Silently ghosting.
			if (!input.startsWith(`y`)) return
			//	Deduct balance & add new exp
			await db.updateInventory({itemId: 52, value: amountToUse, operation: `-`, userId: this.user.id})
			db.addUserExp(totalGainedExp, this.user.id)
			return reply(CARTCOIN.SUCCESSFUL, {
				socket: [
					name(this.user.id),
					emoji(`artcoins`),
					commanifier(amountToUse),
					commanifier(totalGainedExp)
				],
				color: `lightgreen`
			})
		})
	}
}

module.exports.help = {
	start: ConvertArtcoins,
	name: `convertArtcoins`,
	aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`],
	description: `Converts Artcoins into EXP at the rate of 1:2`,
	usage: `cartcoin <Amount>`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}