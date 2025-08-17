module.exports = async function roleDelete(client, role) {
    if (!client.isReady()) return
    if (!role.guild.configs) return
    const logs = role.guild.configs.get(`LOGS_MODULE`).value 
    if (logs) {
        const logChannel = client.getGuildLogChannel(role.guild.id)
        if (logChannel) {
            //  Perform logging to target guild
            client.responseLibs(logChannel, true)
            .send(`I saw a role named **${role.name}** just got deleted from our place. Poor role-san. :(`, {
                header: `Hm, deleted role?`,
                timestampAsFooter: true
            }) 
            .catch(e => e)
        }
    }
    //  Re-validate registered ranks
    const registeredRanks = role.guild.configs.get(`RANKS_LIST`)
	if (registeredRanks.value.length > 0) {
		for (let i=0; i<registeredRanks.value.length; i++) {
			const rank = registeredRanks.value[i]
			//  If the deleted role is one of the registered rank, the ommits from cache and database
			if (role.id === rank.ROLE) {
				const newRegisteredRanks = registeredRanks.value.filter(node => node.ROLE != role.id)
		        await client.db.guildUtils.updateGuildConfiguration({
		            configCode: `RANKS_LIST`,
		            customizedParameter: newRegisteredRanks,
		            guild: role.guild,
		            setByUserId: registeredRanks.setByUserId,
		            cacheTo: role.guild.configs
		        })
			}
		}
	}
	//  Re-validate registered welcomer roles
	const registeredWelcomerRoles = role.guild.configs.get(`WELCOMER_ROLES`)
	if (registeredWelcomerRoles.value.length > 0) {
		for (let i=0; i<registeredWelcomerRoles.value.length; i++) {
			const welcomerRole = registeredWelcomerRoles.value[i]
			//  If the deleted role is one of the welcomer role, the ommits from cache and database
			if (role.id === welcomerRole) {
				const newWelcomerRoles = registeredWelcomerRoles.value.filter(node => node != role.id)
		        await client.db.guildUtils.updateGuildConfiguration({
		            configCode: `WELCOMER_ROLES`,
		            customizedParameter: newWelcomerRoles,
		            guild: role.guild,
		            setByUserId: registeredWelcomerRoles.setByUserId,
		            cacheTo: role.guild.configs
		        })
			}
		}
	}
}
