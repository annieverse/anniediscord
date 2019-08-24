const GUI = require(`../../utils/levelcardInterface`)

/**
 * Main module
 * @Level Display detailed level information.
 */
class Level {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
  *  Initialzer method
  */
	async execute() {
		const { reply, name, code: {LEVELCARD}, meta: {author} } = this.stacks

		//  Returns if user is invalid
		if (!author) return reply(LEVELCARD.INVALID_USER)

		//  Display result
		return reply(LEVELCARD.HEADER, {
			socket: [name(author.id)],
			image: await GUI(this.stacks, author),
			prebuffer: true,
			simplified: true
		})
	}
}

module.exports.help = {
	start: Level,
	name: `level`,
	aliases: [`lvl`, `lv`],
	description: `Pulls up your level`,
	usage: `level`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}