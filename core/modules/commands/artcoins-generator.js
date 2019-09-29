/**
 * Main module
 * @ArtcoinsGenerator Admin command to add artcoins
 */
class ArtcoinsGenerator {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	//  Init
	async execute() {
		const { name, args, collector, palette, emoji, isAdmin, avatar, trueInt, reply, commanifier, code, bot:{db}, meta: { author, data } } = this.stacks

        
		//  Returns if user doesn't have admin authority
		if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)

		//  Returns if user not specifying any parameters
		if (!args[0]) return reply(code.ADDAC.SHORT_GUIDE)

		//  Returns if target is invalid
		if (!author) return reply(code.INVALID_USER)


		//  Confirmation
		reply(code.ADDAC.CONFIRMATION, {
			socket: [emoji(`artcoins`), name(author.id)],
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
					db.setUser(author.id).storeArtcoins(amount)

					//  Successful
					return reply(code.ADDAC.SUCCESSFUL, {
						socket: [
							name(author.id),
							emoji(`artcoins`),
							commanifier(data.artcoins),
							commanifier(amount)]
					})
				})
			})
	}
}


module.exports.help = {
	start: ArtcoinsGenerator,
	name: `artcoins-generator`,
	aliases: [`addac`, `addacs`, `addartcoin`],
	description: `Add artcoins to specific user.`,
	usage: `addac @user <amount>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}