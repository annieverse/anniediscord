/**
 * Main module
 * @currencyGenerator Admin command to add candies
 */
class currencyGenerator {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	//  Init
	async execute() {
		const { name, args, collector, palette, emoji, isDev, avatar, trueInt, reply, commanifier, code, bot:{db}, meta: { author, data } } = this.stacks

        
		//  Returns if user doesn't have admin authority
		//if (!isEventMember && !isAdmin && !isEventManager) return reply(code.UNAUTHORIZED_ACCESS)
		if (!isDev) return reply(code.UNAUTHORIZED_ACCESS)

		//  Returns if user not specifying any parameters
		if (!args[0]) return reply(code.ADDAC.SHORT_GUIDE)

		//  Returns if target is invalid
		if (!author) return reply(code.INVALID_USER)


		//  Confirmation
		reply(code.ADDAC.CONFIRMATION, {
			socket: [emoji(`candies`), name(author.id)],
			thumbnail: avatar(author.id),
			color: palette.golden,
			notch: true
		})
			.then(async confirmation => {
				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()
					let amount = trueInt(input)

					//  Close connections
					confirmation.delete()
					collector.stop()
                

					//  Returns if input is a negative value
					if (!amount) return reply(code.ADDAC.NEGATIVE_VALUES)

					//  Storing new balance value
					db.setUser(author.id).storeCandies(amount)

					console.log(data)
					//  Successful
					return reply(code.ADDAC.SUCCESSFUL, {
						socket: [
							name(author.id),
							emoji(`candies`),
							commanifier(data.candies),
							commanifier(amount)]
					})
				})
			})
	}
}


module.exports.help = {
	start: currencyGenerator,
	name: `lts-currency-generator`,
	aliases: [`addcandy`, `addcandies`],
	description: `Add candies to specific user.`,
	usage: `addcandies @user <amount>`,
	group: `Admin`,
	public: false,
	required_usermetadata: true,
	multi_user: true
}