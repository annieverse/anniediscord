class stickerRemove {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {reply, bot:{db}} = this.stacks
		db.removeSticker
		reply(`Your profile sticker has been removed.`)
	}
}

module.exports.help = {
	start: stickerRemove, 
	name:`removeSticker`, 
	aliases: [`removesticker`,`stickerremove`], 
	description: `remove a sticker from your profile`,
	usage: `removesticker`,
	group: `shop`,
	public: true,
	require_usermetadata: true,
	multi_user: false
}