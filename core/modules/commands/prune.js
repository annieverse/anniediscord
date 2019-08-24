/**
 * Main module
 * @Prune administrator-level bulk messages deletion.
 */
class Prune {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *  Initializer method
     */
	async execute() {
		const { isAdmin, reply, code, args, trueInt, deleteMessages } = this.stacks


		//	Returns if user doesn't have administrator authority
		if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)
		//	Returns if user doesn't specify any parameter
		if (!args[0]) return reply(code.PRUNE.SHORT_GUIDE)


		let amount = trueInt(args[0])


		//	Returns if inputted value is invalid
		if (!amount) return reply(code.PRUNE.INVALID_AMOUNT)
		//	Returns if inputted value is exceeding the limit(100)
		if (amount > 100) return reply(code.PRUNE.EXCEEDING_LIMIT)


		//	Delete a requested amount of messages.
		deleteMessages(amount + 1)
		

		//	Successful
		return reply(code.PRUNE.SUCCESSFUL, {
			socket: [amount],
			deleteIn: 5
		})
	}
}

module.exports.help = {
	start: Prune,
	name: `prune`,
	aliases: [],
	description: `deletes up to 100 messages`,
	usage: `${require(`../../.data/environment.json`).prefix}prune <amount>`,
	group: `Admin`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}