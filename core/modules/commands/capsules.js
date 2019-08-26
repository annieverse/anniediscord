/* eslint-disable no-unreachable */
const Experience = require(`../../utils/ExperienceFormula`)
const databaseManager = require(`../../utils/databaseManager.js`)

/**
 * Main module
 * @Capsule as function to use exp capsules
 */
class Capsule extends databaseManager {
	constructor(Stacks) {
		super(Stacks.meta.author.id)
		this.stacks = Stacks
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const { bot, message, palette,reply,name,trueInt,args,commanifier,emoji,code: {CAPSULE}, meta: {author,data} } = this.stacks
		//this.testFunction()
		//return reply(`command is disabled temporary, sorry for the inconvenice`)
		//  Centralized data object
		let metadata = {
			bot: bot,
			message: message,
			exp_per_capsule: 150,
			to_use: trueInt(args[0]),
			get total_gained() {
				return this.exp_per_capsule * this.to_use
			},
			user: {
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


		//  Returns if user doesn't have any capsule to use.
		// eslint-disable-next-line no-unreachable
		if (!data.power_capsules) return reply(CAPSULE.ZERO)

		//  Returns as guide if amount is not specified or invalid.
		if (!metadata.to_use) return reply(CAPSULE.SHORT_GUIDE)

		//  Returns if owned capsule is lower than the amount of going to be used..
		if (data.power_capsules < metadata.to_use) return reply(CAPSULE.INSUFFICIENT_AMOUNT, {
			socket: [data.power_capsules]
		})

        
		//  Use exp framework
		await new Experience(metadata).runAndUpdate()
		
		this.subtractValue('userinventories', 'power_capsules', metadata.to_use, author.id)

		//  Done
		return reply(CAPSULE.SUCCESSFUL, {
			socket: [
				name(author.id),
				emoji(`power_capsule`),
				commanifier(metadata.to_use),
				commanifier(metadata.total_gained)
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
	group: `Shop-related`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}
