const superagent = require(`superagent`)

class fox {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async initFox() {
		const { reply } = this.stacks
		let { body } = await superagent.get(`https://randomfox.ca/floof/`)
		return reply(``,{
			image:body.image,
			prebuffer: true,
			deleteIn: 5000
		})
	}

	async execute() {
		const {message} = this.stacks
		message.delete()
		this.initFox()
	}
}

module.exports.help = {
	start: fox,
	name: `fox`,
	aliases: [],
	description: `Displays a random picture of a fox.`,
	usage: `fox`,
	group: `Fun`,
	public: true,
	require_usermetadata: false,
	multi_user: false
}