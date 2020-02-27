const Worker = require(`../utils/Worker`)
const Pistachio = require(`../utils/Pistachio`)
module.exports = async (bot, message) => {

	//	Ignore bot
	if (message.author.bot) return
	//	Register new data if its a new user, else ignore.
	await bot.db.validatingNewUser(message.author.id, message.author.username)
	//	Retrieve user metadata from db
	const data = await bot.db.userMetadata(message.author.id)
	

	/**
	 * This used to supply the required metadata in Message Controller.
	 * Also remember, this is only used outside of command-environment.
	 */
	let stacks = new Pistachio({
		label: `msg-${message.author.id}`,
		meta: {
			author: message.author,
			data: data
		},
		bot: bot,
		message: message
	}).bag()

	new Worker(stacks).default()

}
