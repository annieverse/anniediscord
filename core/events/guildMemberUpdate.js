module.exports = (bot, oldUser, newUser) => {

	//	Get logger from @Client
	const { logger } = bot

	function getRoles(r) {
		return bot.guilds.get(`459891664182312980`).roles.find(n => n.name === r)
	}
	
	let ticket = getRoles(`Nickname Changer`)
	let muted = getRoles(`muted`)
	let eventParticipant = getRoles(`Event Participant`)
	let apprenticeship = getRoles(`Apprenticeship`)

	let classRoomChannel = bot.channels.get(`621705949429891074`)

	if (newUser.roles.has(apprenticeship.id) && !oldUser.roles.has(apprenticeship.id)) {
		logger.info(`${newUser.user.username} joined the classroom.`)

		classRoomChannel.send(`${newUser} joined the classroom.`)
	}
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
  
}