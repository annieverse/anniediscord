const Worker = require(`../utils/Worker`)
const Pistachio = require(`../utils/Pistachio`)
module.exports = async (bot, message) => {

	//	Ignore bot
	if (message.author.bot) return
	//	Register new data if its a new user, else ignore.
	await bot.db.validatingNewUser(message.author.id)
	//	Retrieve user metadata from db
	const data = await bot.db.userMetadata(message.author.id)
	/**
	 * This used to supply the required metadata in Message Controller.
	 * Also remember, this is only used outside of command-environment.
	 */
	let stacks = new Pistachio({
		label: `msg-${message.author.id}`,
		applyTicketBuffs: true,
		applyCardBuffs: true,
		ac_factor: 1,
		exp_factor: 1,
		gainArtcoins: true,
		meta: {
			author: message.author,
			data: data
		},
		bot: bot,
		message: message,
		cooldown: 30000,
		total_gained_exp: Math.round(Math.random() * (15 - 10 + 1)) + 10,
		total_gained_ac: Math.round(Math.random() * (15 - 10 + 1)) + 10,
		updated: {
			currentexp: 0,
			level: 0,
			maxexp: 0,
			nextexpcurve: 0
		}
	}).bag()

	//	Check for message flow
	new Worker(stacks).default()

}
