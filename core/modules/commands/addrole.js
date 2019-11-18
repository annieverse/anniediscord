class AddRole {
	constructor(Stacks) {
		this.stacks = Stacks
		this.required_roles = Stacks.message.member.roles.find(r => Object.keys(this.stacks.roles.admin).some(i => this.stacks.roles.admin[i] === r.id))
	}

	async execute() {

		const { reply, args, code: { ADDROLE, UNAUTHORIZED_ACCESS }, meta: { author }, message, palette, addRole} = this.stacks

		if (!message.member.hasPermission(`MANAGE_ROLES`) || !this.required_roles) return reply(UNAUTHORIZED_ACCESS, {color:palette.red})
		if (!args[0]) return reply(ADDROLE.NO_USER, {color : palette.red})
		let pUser = author
		if (!pUser || pUser === null) return reply(ADDROLE.NO_USER_FOUND, {
			socket: [message.author],
			color: palette.red
		})
		if (!args[1]) return reply(ADDROLE.NO_ROLE_SPECIFIED, {color:palette.red})
		let role = args[1].substring(3, 21)
		let gRole = message.guild.roles.get(role)
		if (!gRole) return reply(ADDROLE.NO_ROLE_FOUND, {
			socket: [this.stacks.message.author],
			color: palette.red
		})
		if (pUser._roles.includes(gRole.id)) return reply(ADDROLE.HAS_ROLE_ALREADY, {
			socket: [pUser],
			color: palette.red
		})
		await (addRole(gRole.name, pUser.id))
		message.react(`👌`)
		try {
			reply(ADDROLE.ROLE_ADDED, {
				color: palette.green,
				field: pUser,
				socket: [pUser, gRole.name]
			}).catch(() => {
				return reply(ADDROLE.DMS_LOCKED, {
					color: palette.green,
					socket: [pUser, gRole.name]
				})
			})
		} catch (e) {
			return reply(ADDROLE.DMS_LOCKED, {
				color: palette.green,
				socket: [pUser, gRole.name]
			})
		}
	}
}

module.exports.help = {
	start: AddRole,
	name: `addrole`,
	aliases: [],
	description: `Add roles to specific user.`,
	usage: `addrole @user @role`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}
