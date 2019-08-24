const Experience = require(`../../utils/ExperienceFormula`)

/**
 * Main module
 * @convertingArtcoins as function to convert artcoins into experience points.
 */
class convertingArtcoins {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const { bot, message, args, palette, trueInt, name, emoji, commanifier, reply, db, code:{CARTCOIN}, meta:{author, data} } = this.stacks
        
		//  Returns as guide if user doesn't specify any parameters
		if (!args[0]) return reply(CARTCOIN.SHORT_GUIDE)
        
		let metadata = {
			bot: bot,
			message: message,
			to_use: args[0].startsWith(`all`) ? data.artcoins : trueInt(args[0]),
			get total_gained() {
				return this.to_use / 2
			},
			previous: {
				currentexp: data.currentexp,
				level: data.level,
				maxexp: data.maxexp,
				nextexpcurve: data.nextexpcurve
			},
			updated: {
				currentexp: 0,
				level: 0,
				maxexp: 0,
				nextexpcurve: 0
			}
		}

		//  Returns if user's artcoins is below the amount of going to be used
		if (data.artcoins < metadata.to_use) return reply(CARTCOIN.INSUFFICIENT_AMOUNT, {
			socket: [emoji(`artcoins`), commanifier(data.artcoins)]
		})

		//  Returns if user input is below the acceptable threeshold
		if (!metadata.to_use || metadata.to_use < 2) return reply(CARTCOIN.INVALID_AMOUNT)
                

		//  Use exp framework
		const xp = new Experience(metadata)


		//  Withdraw capsules and get calculated new exp metadata
		await db(author.id).withdraw(metadata.to_use, `artcoins`)
		await xp.updatingExp()


		//  Update rank if current rank rank is not equal with the new rank.
		if (xp.rankUp) {
			await xp.removeRank()
			await xp.addRank()
		}


		//  Done
		return reply(CARTCOIN.SUCCESSFUL, {
			socket: [
				name(author.id),
				emoji(`artcoins`),
				commanifier(metadata.to_use),
				commanifier(metadata.total_gained)
			],
			color: palette.lightgreen
		})
	}
}

module.exports.help = {
	start: convertingArtcoins,
	name: `convertartcoin`,
	aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`],
	description: `Converts AC into XP`,
	usage: `${require(`../../.data/environment.json`).prefix}cartcoins <amount>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}