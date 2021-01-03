module.exports = async (bot, role) => {
	const configs = bot.fetchGuildConfigs(role.guild.id)
    let metadata = {
        role: role,
        typeOfLog: `ROLE_DELETE`,
        bot: bot,
        guild: role.guild
    }
    if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
    //  Re-validate registered ranks
    const registeredRanks = configs.get(`RANKS_LIST`)
	if (registeredRanks.value.length > 0) {
		for (let i=0; i<registeredRanks.value.length; i++) {
			const rank = registeredRanks.value[i]
			//  If the deleted role is one of the registered rank, the ommits from cache and database
			if (role.id === rank.ROLE) {
				const newRegisteredRanks = registeredRanks.value.filter(node => node.ROLE != role.id)
		        await bot.db.updateGuildConfiguration({
		            configCode: `RANKS_LIST`,
		            customizedParameter: newRegisteredRanks,
		            guild: role.guild,
		            setByUserId: registeredRanks.setByUserId,
		            cacheTo: configs
		        })
		        bot.logger.info(`[Event.roleDelete] Delete registered rank(LV:${rank.LEVEL}) ROLE_ID:${role.id} from GUILD_ID:${role.guild.id}`)
			}
		}
	}
	//  Re-validate registered welcomer roles
	const registeredWelcomerRoles = configs.get(`WELCOMER_ROLES`)
	if (registeredWelcomerRoles.value.length > 0) {
		for (let i=0; i<registeredWelcomerRoles.value.length; i++) {
			const welcomerRole = registeredWelcomerRoles.value[i]
			//  If the deleted role is one of the welcomer role, the ommits from cache and database
			if (role.id === welcomerRole) {
				const newWelcomerRoles = registeredWelcomerRoles.value.filter(node => node != role.id)
		        await bot.db.updateGuildConfiguration({
		            configCode: `WELCOMER_ROLES`,
		            customizedParameter: newWelcomerRoles,
		            guild: role.guild,
		            setByUserId: registeredWelcomerRoles.setByUserId,
		            cacheTo: configs
		        })
		        bot.logger.info(`[Event.roleDelete] Delete registered welcomer ROLE_ID:${role.id} from GUILD_ID:${role.guild.id}`)
			}
		}
	}
}