class serverBoost {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	boostNum() {
		const { reply } = this.stacks
		return reply(`Support for this feature has been discontinued`)
		/*
		return reply(`This Server has a total of ${this.stacks.message.guild.roles.find(n => n.id === `585550404197285889`).members.map(m => m.user.tag).length} boosts currently!!`)
		*/
	}

	boostMembers() {
		const { reply } = this.stacks
		return reply(`These are the members currently boosting the server :D\n${this.stacks.message.guild.roles.find(n => n.id === `585550404197285889`).members.map(m => m.user.tag).join(`\n`)}`)
	}

	boostLevel() {
		//const { reply, message, roles: { nitro_booster } } = this.stacks
		const { reply } = this.stacks
		return reply(`Support for this feature has been discontinued`)
		/*
		let count = message.guild.roles.find(n => n.id === nitro_booster).members.map(m => m.user.tag).length
		let response
		let nolevel = 0,level1 = 2,level2 = 15,level3 = 30
		if (count >= nolevel && count < level1) response = `The current level for server boosts is: Level 0`
		if (count >= level1 && count < level2) response = `The current level for server boosts is: Level 1`
		if (count >= level2 && count < level3) response = `The current level for server boosts is: Level 2`
		if (count >= level3) response = `The current level for server boosts is: Level 3`
		return reply(response)
		*/
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