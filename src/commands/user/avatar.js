/**
 * Main module
 * @Avatar showing user avatar
 */
class Avatar {
	constructor(Stacks) {
		this.stacks = Stacks
	}
	async execute() {
		const { avatarWrapper, meta: { author } } = this.stacks
		return avatarWrapper(author.id)
	}
}



module.exports.help = {
	start: Avatar,
	name: `avatar`,
	aliases: [`ava`, `pfp`],
	description: `Grabs your's or a specified user's avatar and displays it`,
	usage: `avatar [user]`,
	group: `Fun`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}