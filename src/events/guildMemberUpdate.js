const BoosterPerks = require(`../libs/nitroPerks`)
module.exports = async (bot, oldUser, newUser, configs) => {
	let metadata = {
		oldUser: oldUser,
		newUser: newUser,
		guild: oldUser.guild,
		typeOfLog: `GUILD_MEMBER_UPDATE`,
		bot: bot
	}

	function getRoles(r) {
		return bot.guilds.cache.get(metadata.guild.id).roles.cache.find(n => n.name === r)
	}
	
	let ticket, muted, eventParticipant, nitro_role
	if (configs.get(`NICKNAME_CHANGER_ROLE`).value) ticket = getRoles(configs.get(`NICKNAME_CHANGER_ROLE`).value)
	if (configs.get(`MUTE_ROLE`).value) muted = getRoles(configs.get(`MUTE_ROLE`).value)
	if (configs.get(`EVENT_PARTICIPANT_ROLE`).value) eventParticipant = getRoles(configs.get(`EVENT_PARTICIPANT_ROLE`).value)
	if (configs.get(`NITRO_ROLE`).value) nitro_role = getRoles(configs.get(`NITRO_ROLE`).value)


	if( ticket && newUser.roles.has(ticket.id) && (oldUser.nickname !== newUser.nickname) ) {
		bot.logger.info(`${newUser.nickname} used the nickname changer ticket.`)
		newUser.roles.remove(ticket)
	}
	
	if (muted && newUser.roles.has(muted.id)){
		if (eventParticipant && newUser.roles.has(eventParticipant.id)){
			newUser.roles.remove(eventParticipant.id)
			bot.logger.info(`${newUser.nickname} was given the ${muted.name} role so their event participant role has been taken away.`)
		}
	}
	
	if (!nitro_role) return
	const firstTimeBoostingServer = newUser.roles.cache.has(nitro_role) && !oldUser.roles.cache.has(nitro_role)
	//	Send out special perks if user receiving Shining Rich Star role.
	if (firstTimeBoostingServer) {
		const Perk = new BoosterPerks({bot, oldUser, newUser})
        let alreadyHasVipBadge = this.db.checkVIPStatus(this.client.newUser.author.id, this.guild)
		if (alreadyHasVipBadge == 1) return
		Perk.artcoinsPack()
		Perk.vipBadge()
	}
	//const BoostingServerStopped = !newUser.roles.has(nitro_booster) && oldUser.roles.has(nitro_booster)
	const BoostingServerStopped = !newUser.roles.cache.has(nitro_role) && oldUser.roles.cache.has(nitro_role)

	// Remove Booster only color roles if stopped boosting
	if (BoostingServerStopped){
		const BoosterColorList = configs.get(`BOOSTER_COLORS_LIST`).value
		if (!BoosterColorList) return
		newUser.roles.remove(BoosterColorList)
			.then(r => bot.logger.info(`booster color roles removed from ${r.user.tag}`)) // 
			.catch(()=>null) // Ignore the error
	}
	
}