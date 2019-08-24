const GUI = require(`../../utils/profilecardInterface`)

/**
 * Main module
 * @Profile Display detailed user personal card.
 */
class Profile {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *  Initialzer method
     */
	async execute() {
		const { reply, name, code: {PROFILECARD}, meta: {author} } = this.stacks

		//  Returns if user is invalid
		if (!author) return reply(PROFILECARD.INVALID_USER)
    
		//  Display result
		return reply(PROFILECARD.HEADER, {
			socket: [name(author.id)],
			image: await GUI(this.stacks, author),
			prebuffer: true,
			simplified: true
		})
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`prfl`, `profil`, `p`, `mycard`],
	description: `Display user's profile card`,
	usage: `profile [@user]<optional>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}