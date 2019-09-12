module.exports = (bot, oldUser, newUser) => {

	//	Get logger from @Client
	const { logger } = bot

	function getRoles(r) {
		return bot.guilds.get(`459891664182312980`).roles.find(n => n.name === r)
	}
	function getRolesById(r) {
		return bot.guilds.get(`459891664182312980`).roles.find(n => n.id === r)
	}
	let ticket = getRoles(`Nickname Changer`)
	let muted = getRoles(`muted`)
	let eventParticipant = getRoles(`Event Participant`)
	let apprenticeship = getRolesById(`621729846753755136`)
	let classRoomChannel = bot.channels.get(`565308091424571422`)

	console.log(apprenticeship)

	if (newUser.roles.has(apprenticeship.id)) {
		logger.info(`${newUser.nickname} joined the classrooms.`)
		classRoomChannel.send(`${newUser.nickname} joined the classrooms.`)
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