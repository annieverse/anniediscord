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

	//	Send out artcoins pack if user receiving Shining Rich Star role.
	if (firstTimeBoostingServer) new BoosterPerks({bot, oldUser, newUser}).artcoinsPack()
  
}