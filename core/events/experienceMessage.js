const ExperienceController = require(`../utils/ExperienceController`)

module.exports = async (bot, message) => {

	//	Extract db
	const { db } = bot
	//	Set current author of the message
	db.setUser = message.author.id

	//	Register new data if its a new user, else ignore.
	db.validatingNewUser()

	//	Retrieve user metadata from db
	const data = await db.userMetadata

	//	This used to supply the required metadata in Experience Class.
	let metadata = {
		applyTicketBuffs: true,
		applyCardBuffs: false,
		cardCollections: {},
		bonus: 1,
		user: data,
		bot: bot,
		message: message,
		get total_gained() {
			return Math.round(Math.random() * (15 - 10 + 1)) + 10
		},
	}

	//	Get required methods from controller
	const { runAndUpdate, unqualifiedToGetExp } = new ExperienceController(metadata)

	//	Return if user has failed to pass the conditions for gaining exp
	if (unqualifiedToGetExp) return

	//	Update exp
	runAndUpdate()

}
