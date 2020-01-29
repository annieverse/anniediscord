
/**
 * Main module
 * @Say function bundler to talk through bot
 */
class Say {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *	Initializer method
     */
	async execute() {
		const { isAdmin, code, name, reply, args, message, meta: {author} } = this.stacks

		//  Returns if user has no admin authority
		if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)
		//	Returns as short-guide if user's custom message length is zero.
		if (!args[0]) return reply(code.SAY.SHORT_GUIDE, {socket: [name(author.id)]})
		//	Parse custom message
		let content = message.content.slice(message.content.indexOf(args[0]))
		//	Hide author message
		message.delete()
		//	Send custom message
		return reply(content)
	}
}

module.exports.help = {
	start: Say,
	name: `say`,
	aliases: [],
	description: `Talk through bot`,
	usage: `say <message>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}