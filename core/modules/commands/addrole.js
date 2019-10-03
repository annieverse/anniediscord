class AddRole {
	constructor(Stacks) {
		this.stacks = Stacks
		this.required_roles = Stacks.message.member.roles.find(r => Object.keys(this.stacks.roles.admin).some(i => this.stacks.roles.admin[i] === r.id))
	}

	async execute() {

		if (!this.stacks.message.member.hasPermission(`MANAGE_ROLES`) || !this.required_roles) return this.stacks.utils.sendEmbed(this.stacks.code.UNAUTHORIZED_ACCESS, this.stacks.palette.red)
		if (!this.stacks.args[0]) return this.stacks.utils.sendEmbed(this.stacks.code.ADDROLE.NO_USER, this.stacks.palette.red)
		let pUser = await this.stacks.utils.userFinding(this.stacks.args[0] || this.stacks.message.mentions.users.first())
		if (!pUser || pUser === null) return this.stacks.reply(this.stacks.code.ADDROLE.NO_USER_FOUND, {
			socket: [this.stacks.message.author],
			color: this.stacks.palette.red
		})
		if (!this.stacks.args[1]) return this.stacks.utils.sendEmbed(this.stacks.code.ADDROLE.NO_ROLE_SPECIFIED, this.stacks.palette.red)
		let role = this.stacks.args[1].substring(3, 21)
		let gRole = this.stacks.message.guild.roles.get(role)
		if (!gRole) return this.stacks.reply(this.stacks.code.ADDROLE.NO_ROLE_FOUND, {
			socket: [this.stacks.message.author],
			color: this.stacks.palette.red
		})
		if (pUser._roles.includes(gRole.id)) return this.stacks.reply(this.stacks.code.ADDROLE.HAS_ROLE_ALREADY, {
			socket: [pUser],
			color: this.stacks.palette.red
		})
		await (this.stacks.addRole(gRole.name, pUser.id))
		this.stacks.message.react(`👌`)
		try {
			this.stacks.reply(this.stacks.code.ADDROLE.ROLE_ADDED, {
				color: this.stacks.palette.green,
				field: pUser,
				socket: [pUser, gRole.name]
			}).catch(() => {
				return this.stacks.reply(this.stacks.code.ADDROLE.DMS_LOCKED, {
					color: this.stacks.palette.green,
					socket: [pUser, gRole.name]
				})
			})
		} catch (e) {
			return this.stacks.reply(this.stacks.code.ADDROLE.DMS_LOCKED, {
				color: this.stacks.palette.green,
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
	required_usermetadata: false,
	multi_user: false
}
