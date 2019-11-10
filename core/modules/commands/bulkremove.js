class bulkRoleRemove {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const { message, reply, args, bot: { logger }, isEventMember, isModerator, code: { UNAUTHORIZED_ACCESS}} = this.stacks
		if (!isEventMember && !isModerator) return reply(UNAUTHORIZED_ACCESS)
		if (!args) return reply(`Please supply the roles by taging`)
		try {
			let roles = message.mentions.roles
			let roleNames = []
			roles.forEach(role=>{
				let r = message.guild.roles.get(role.id)
				message.guild.members.forEach(member => {
					if (!member.roles.find(t => t.name == r.name)) return
					logger.info(`${member.user.tag} has role ${r.name}`)
					member.removeRole(role.id)
				})
				roleNames.push(role.name)
			})			
			reply(`All members with the roles: {0}, have had the role removed`,{socket:[roleNames.join(`, `)]})
		} catch (error) {
			logger.error(`bulk role removed failed: Error: ${error.stack}`)
			reply(`Bulkremoval of role failed`)
		}
	}
}

module.exports.help = {
	start: bulkRoleRemove, 
	name:`bulkremove`,
	aliases: [`bulkroleremove`], 
	description: `Removes a role from everybody that has it`,
	usage: `bulkremove <@role>...`,
	group: `Admin`,
	public: true,
	require_usermetadata: true,
	multi_user: false
}