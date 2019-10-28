class pansgift {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {reply, bot: {db}} = this.stacks
		db.panGift()
		reply(`done hehe`)
	}
}

module.exports.help = {
	start: pansgift, 
	name:`PansGift`, 
	aliases: [`pansgift`], 
	description: `My blessing to give candy`,
	usage: `pansgift`,
	group: `developer`,
	public: false,
	require_usermetadata: false,
	multi_user: false
}