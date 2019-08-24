
/**
 * Main module
 * @ExperienceReset reset user's experience metadata.
 */
class ExperienceReset {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *	Initializer method
     */
	async execute() {
		const { isAdmin, code, name, reply, db, meta: {author} } = this.stacks

		//  Returns if user has no admin authority
		if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)
		//  Returns if target user is invalid
		if (!author) return reply(code.INVALID_USER)


		//  Update exp metadata
		await db(author.id).resetExperiencePoints()


		//  Successful
		return reply(code.RESET_EXP, {
			socket: [name(author.id)]
		})
	}
}

module.exports.help = {
	start: ExperienceReset,
	name:`reset-lvl`,
	aliases: [`reset_lvl`],
	description: `resets your level`,
	usage: `${require(`../../.data/environment.json`).prefix}>reset_lvl`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}