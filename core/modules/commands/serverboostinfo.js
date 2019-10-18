class serverBoost {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	boostNum() {
		const { reply } = this.stacks
		return reply(`This Server has a total of ${this.stacks.message.guild.roles.find(n => n.id === `585550404197285889`).members.map(m => m.user.tag).length} boosts currently!!`)
	}

	boostMembers() {
		const { reply } = this.stacks
		return reply(`These are the members currently boosting the server :D\n${this.stacks.message.guild.roles.find(n => n.id === `585550404197285889`).members.map(m => m.user.tag).join(`\n`)}`)
	}

	boostLevel() {
		const { reply,message,roles: { nitro_boost } } = this.stacks
		let count = message.guild.roles.find(n => n.id === nitro_boost).members.map(m => m.user.tag).length
		let response
		if (count >= 2 && count < 10) response = `The current level this server boosts is: Level 1`
		if (count >= 10 && count < 50) response = `The current level this server boosts is: Level 2`
		if (count >= 50) response = `The current level this server for boosts is: Level 3`
		return reply(response)
	}

	helpCenter(){
		const { reply, code: { SERVER_BOOST } , command } = this.stacks
		return reply(SERVER_BOOST.SHORT_GUIDE,{
			socket: [command, command, command]
		})
	}

	async execute() {
		const { args } = this.stacks
		if (!args[0]) return this.helpCenter()
		if ([`level`, `lvl`, `l`].some(x => x.toLowerCase() === args[0].toLowerCase())) return this.boostLevel()
		if ([`members`,`member`, `mem`, `m`].some(x => x.toLowerCase() === args[0].toLowerCase())) return this.boostMembers()
		if ([`boost`, `boo`, `b`].some(x => x.toLowerCase() === args[0].toLowerCase())) return this.boostNum()
	}
}

module.exports.help = {
	start: serverBoost,
	name: `serverboostinfo`,
	aliases: [`sb`, `serverboost`,`sboost`],
	description: `Displays info about server boost level.`,
	usage: `sb members | level | boost`,
	group: `General`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}