const Command = require(`../../libs/commands`)

/**
 * Add artcoins to a user
 * @author klerikdust
 */
class ArtcoinsGenerator extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, bot:{locale, db}, name, palette, collector, multicollector, trueInt, emoji, commanifier, message }) {
		await this.requestUserMetadata(2)
		if (!this.user) return reply(locale.ERR.UNABLE_TO_FIND_USER)

		//  Confirmation
		const user = this.user
		reply(locale.ADDAC.CONFIRMATION_SEQ_1, {color: palette.golden})
			.then(async confirmation => {
				const firstCollector = collector(message)
				firstCollector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()
					let amount = trueInt(input)

					//  Close connections
					confirmation.delete()
					firstCollector.stop()
                
					//  Returns if input is a negative value
					if (!amount) return reply(locale.ERR.NEGATIVE_INPUT)

					reply(locale.ADDAC.CONFIRMATION_SEQ_2, {
						socket: [emoji(`artcoins`), commanifier(amount), name(user.id)],
						color: palette.golden
					})
						.then(async proceed =>{
						let secondCollector = multicollector(msg)
						secondCollector.on(`collect`, async (secondmsg) => {
							let inputtwo = secondmsg.content.toLowerCase()
							proceed.delete()
							secondCollector.stop()
							if (inputtwo != `y`) return reply(locale.ADDAC.TRANSACTION_CLOSED)

							//  Story artcoins into db
							await db.updateInventory({itemId: 52, value: amount, userId: user.id})
							//  Successful
							return reply(locale.ADDAC.SUCCESSFUL, {
								socket: [
									name(user.id),
									emoji(`artcoins`),
									commanifier(amount)],
								color: palette.lightgreen
							})
						})
					})
				})
			})
	}
}


module.exports.help = {
	start: ArtcoinsGenerator,
	name: `artcoinsGenerator`,
	aliases: [`addac`, `addacs`, `addartcoin`],
	description: `Add artcoins to a user`,
	usage: `addac <User>(Optional)`,
	group: `Developer`,
	permissionLevel: 4,
	public: true,
	multiUser: true
}