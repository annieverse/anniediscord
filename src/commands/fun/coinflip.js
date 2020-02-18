class Coinflip {
	constructor(Stacks) {
		this.stacks = Stacks
		this.dice = [`heads`, `tails`]
	}

	async execute() {
		const { reply, choice } = this.stacks
		return reply(`This coin landed on **${choice(this.dice)}**!`)
	}
}

module.exports.help={
	start: Coinflip,
	name:`coinflip`,
	aliases: [`cf`],
	description: `filps a coin for heads or tails`,
	usage: `filpcoin`,
	group: `Fun`,
	public: true,
	require_usermetadata: false,
	multi_user: false
}