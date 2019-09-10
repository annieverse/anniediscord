const Worker = require(`../utils/Worker`)
const Pistachio = require(`../utils/Pistachio`)
var AsyncLock = require(`async-lock`)

module.exports = async (bot, message) => {
	var lock = new AsyncLock()
	var data
	lock.acquire(bot.db, async function() {//async work
		//	Set current author of the message
		bot.db.setUser = message.author.id

		//	Register new data if its a new user, else ignore.
		await bot.db.validatingNewUser()

		//	Retrieve user metadata from db
		data = await bot.db.userMetadata
	}, function() {// lock released
		/**
		 * This used to supply the required metadata in Message Controller.
		 * Also remember, this is only used outside of command-environment.
		 */
		let stacks = new Pistachio({
			label: `msg-${message.author.id}`,
			applyTicketBuffs: true,
			applyCardBuffs: true,
			bonus: 0,
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
	})
}
