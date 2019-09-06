const Worker = require(`../utils/Worker`)
const Pistachio = require(`../utils/Pistachio`)

module.exports = async (bot, message) => {

	//	Set current author of the message
	bot.db.setUser = message.author.id

	//	Register new data if its a new user, else ignore.
	await bot.db.validatingNewUser()

	//	Retrieve user metadata from db
	const data = await bot.db.userMetadata

	/**
	 * This used to supply the required metadata in Message Controller.
	 * Also remember, this is only used outside of command-environment.
	 */
	let stacks = new Pistachio({
		datatype: `DEFAULT_MSG`,
		applyTicketBuffs: true,
		applyCardBuffs: true,
		bonus: 0,
		getArtcoins: true,
		meta: {
			author: message.author,
			data: data
		},
		bot: bot,
		message: message,
		cooldown: {
			exp: 30000
		},
		total_gained: Math.round(Math.random() * (15 - 10 + 1)) + 10,
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
