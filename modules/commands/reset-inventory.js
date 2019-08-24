
/**
 * Main module
 * @resetInventory reset user's inventory metadata
 */
class resetInventory {
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
		await db(author.id).resetInventory()


		//  Successful
		return reply(code.RESET_INVENTORY, {
			socket: [name(author.id)]
		})
	}
}

module.exports.help = {
	start: resetInventory,
	name: `reset-inventory`,
	aliases: [`_resetinventory`],
	description: `resets your inventory`,
	usage: `${require(`../../.data/environment.json`).prefix}_resetinventory`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}