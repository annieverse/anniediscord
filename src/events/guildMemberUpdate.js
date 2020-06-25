const BoosterPerks = require(`../utils/BoosterPerks`)
const { nitro_booster } = require(`../utils/role-list`)


module.exports = (bot, oldUser, newUser) => {

	//	Get logger from @Client
	const { logger } = bot

	function getRoles(r) {
		return bot.guilds.get(`459891664182312980`).roles.find(n => n.name === r)
	}
	
	let ticket = getRoles(`Nickname Changer`)
	let muted = getRoles(`muted`)
	let eventParticipant = getRoles(`Event Participant`)
	const firstTimeBoostingServer = newUser.roles.has(nitro_booster) && !oldUser.roles.has(nitro_booster)


	if( newUser.roles.has(ticket.id) && (oldUser.nickname !== newUser.nickname) ) {
		logger.info(`${newUser.nickname} used the nickname changer ticket.`)
		newUser.removeRole(ticket)
	}
	if (newUser.roles.has(muted.id)){
		if(newUser.roles.has(eventParticipant.id)){
			newUser.removeRole(eventParticipant.id)
			logger.info(`${newUser.nickname} was given the ${muted.name} role so their event participant role has been taken away.`)
		}
	}

	//	Send out special perks if user receiving Shining Rich Star role.
	if (firstTimeBoostingServer) {
		const Perk = new BoosterPerks({bot, oldUser, newUser})
		Perk.artcoinsPack()
		Perk.vipBadge()
	}
	//const BoostingServerStopped = !newUser.roles.has(nitro_booster) && oldUser.roles.has(nitro_booster)
	const BoostingServerStopped = !newUser.roles.has(`653697761937588226`) && oldUser.roles.has(`653697761937588226`)

	// Remove Booster only color roles if stopped boosting
	if (BoostingServerStopped){
		const BoosterColorList = [
			`633667685380522014`, // Grape Soda
			`633657057312243714`, // Purple Cake
			`633668318309384202`, // Blackberries
			`633668872825864197`, // Raisians Pie
			`633656867238838273`, // Cotton Candy
			`633658977414152197`, // Raspberries
			`633655811515613184`, // Pink Yogurt
			`633658396133818370`, // Gummy
			`633657841332387841`, // Pancake
			`633658254760869908`, // Butter Bread
			`633659130267172874`, // Biscuit
			`633664003595436042`, // Lemon Syrup
			`633657646221754378`, // Minty Ice Cream
			`633658576660987914`, // Green Tea
			`633670165921267742`, // Jelly Bean
			`633670728247541791`, // Pickles
			`633657387890507776`, // Bubblegum
			`633660261147869215`, // Mineral Water
			`633671039838322708`, // Blueberries
			`633675926625845248`, // Blue Cheese
			`633659872252264468`, // Oreo
			`633660074392420392`, // Milkshake
		]
		
		newUser.removeRoles(BoosterColorList)
			.then(r => logger.info(`booster color roles removed from ${r.user.tag}`)) // 
			.catch(()=>null) // Ignore the error
	}
	var metadata = {
		oldUser: oldUser,
		newUser: newUser,
		guild: oldUser.guild,
		typeOfLog: `guildMemberUpdate`,
		bot: bot
	}
	if (bot.WANT_CUSTOM_LOGS && bot.guildMemberUpdate) new bot.logSystem(metadata).record()
}