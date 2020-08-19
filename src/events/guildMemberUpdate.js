const BoosterPerks = require(`../libs/nitroPerks`)

module.exports = async (bot, oldUser, newUser) => {

	await bot.updateConfig(oldUser.guild.id)

	var metadata = {
		oldUser: oldUser,
		newUser: newUser,
		guild: oldUser.guild,
		typeOfLog: `guildMemberUpdate`,
		bot: bot
	}
	if (bot.WANT_CUSTOM_LOGS && bot.guildMemberUpdate) new bot.logSystem(metadata).record()

	function getRoles(r) {
		return bot.guilds.cache.get(bot.guild_id).roles.cache.find(n => n.name === r)
	}
	
	let ticket, muted, eventParticipant
	if (bot.nickname_changer) ticket = getRoles(bot.nickname_changer)
	if (bot.mute_role) muted = getRoles(bot.mute_role)
	if (bot.event_participant) eventParticipant = getRoles(bot.event_participant)


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

	/** 
	* Temporarily disabled
	* Reason: ref to Issues - #285 
	*/
	/*
	if (!bot.nitro_role) return
	const firstTimeBoostingServer = newUser.roles.has(bot.nitro_role) && !oldUser.roles.has(bot.nitro_role)
	//	Send out special perks if user receiving Shining Rich Star role.
	if (firstTimeBoostingServer) {
		const Perk = new BoosterPerks({bot, oldUser, newUser})
        let alreadyHasVipBadge = this.db.checkVIPStatus(this.client.newUser.author.id, this.guild)
		if (alreadyHasVipBadge == 1) return
		Perk.artcoinsPack()
		Perk.vipBadge()
	}
	//const BoostingServerStopped = !newUser.roles.has(nitro_booster) && oldUser.roles.has(nitro_booster)
	const BoostingServerStopped = !newUser.roles.has(bot.nitro_role) && oldUser.roles.has(bot.nitro_role)

	// Remove Booster only color roles if stopped boosting
	if (BoostingServerStopped){
		const BoosterColorList = bot.booster_color_list
		
		newUser.roles.remove(BoosterColorList)
			.then(r => bot.logger.info(`booster color roles removed from ${r.user.tag}`)) // 
			.catch(()=>null) // Ignore the error
	}
	*/
}