/* eslint-disable no-unreachable */
const Experience = require(`../../struct/points/experience`)

/**
 * Main module
 * @Capsule as function to use exp capsules
 */
class Capsule {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const { db, palette,reply,name,trueInt,args,commanifier,emoji,code: {CAPSULE}, meta: {author,data} } = this.stacks
		//  Centralized data object

		let metadata = {
			...this.stacks,
			exp_per_capsule: 150,
			to_use: trueInt(args[0]),
			get total_gained_exp() { return this.exp_per_capsule * this.to_use },
			updated: {
				currentexp: 0,
				maxexp: 0,
				nextexpcurve: 0,
				level: 0
			},
		}
		//  Returns if user doesn't have any capsule to use.
		if (!data.power_capsules) return reply(CAPSULE.ZERO)
		//  Returns as guide if amount is not specified or invalid.
		if (!metadata.to_use) return reply(CAPSULE.SHORT_GUIDE)
		//  Returns if owned capsule is lower than the amount of going to be used..
		if (data.power_capsules < metadata.to_use) return reply(CAPSULE.INSUFFICIENT_AMOUNT, {
			socket: [data.power_capsules]
		})

        
		//  Use exp framework
		await new Experience(metadata).runAndUpdate()

		db(author.id).withdraw(metadata.to_use, 70)

		//  Done
		return reply(CAPSULE.SUCCESSFUL, {
			socket: [
				name(author.id),
				emoji(`power_capsule`),
				commanifier(metadata.to_use),
				commanifier(metadata.total_gained_exp)
			],
			color: palette.lightgreen
		})
	}
}
module.exports.help = {
	start: Capsule,
	name: `capsules`,
	aliases: [`eat`],
	description: `Eats the capsules you get from gacha and gives you XP in return`,
	usage: `eat <amount>`,
	group: `shop`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}
