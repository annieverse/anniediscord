
/**
*   Main module
*   @Pay sharing artcoins with other user.
*/
class Pay {
	constructor(Stacks) {
		this.stacks = Stacks
		this.requirement_level = 5
	}


	/**
     *  Get sender's author object and inventory metadata.
     */
	async assignSenderMetadata() {
		const { reqData } = this.stacks
		const res = await reqData()
		this.senderMeta = res
	}


	/**
     *  Initializer method
     */
	async execute() {
		const { bot, args, db, avatar, multicollector, commanifier, emoji, reply, collector, selfTargeting, name, trueInt, palette, code: {PAY}, meta: {author, data} } = this.stacks


		//  Returns as guide user doesn't specify any parameter
		if (!args[0]) return reply(PAY.SHORT_GUIDE)
		//  Get sender metadata
		await this.assignSenderMetadata()
		//  Returns if user level is below the requirement
		if (this.senderMeta.data.level < this.requirement_level) return reply(PAY.LVL_TOO_LOW, {socket: [this.requirement_level]})
		//  Returns if target is invalid
		if (!author) return reply(PAY.INVALID_USER)
		//  Returns if user trying to pay themselves
		if (selfTargeting) return reply(PAY.SELF_TARGETING)


		//  User confirmation
		reply(PAY.USER_CONFIRMATION, {socket: [name(author.id)], color: palette.golden})
			.then(async targetInfo => {

				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()
					let amount = trueInt(input)
                
					//  Register second listener
					let confirmation = multicollector(msg)
                
					//  Closing connections
					targetInfo.delete()
					collector.stop()
                

					//  Returns if user asked to cancel the transaction
					if(input.startsWith(`n`)) return reply(PAY.CANCELLED)
					//  Returns if input is invalid
					if (!amount) return reply(PAY.INVALID_AMOUNT)
					//  Returns if sender's balance is below the specified input
					if (this.senderMeta.data.artcoins < amount) return reply(PAY.EXCEEDING_BALANCE)


					msg.delete()
					//  Amount confirmation
					reply(PAY.CONFIRMATION, {
						socket: [emoji(`artcoins`), commanifier(amount), name(author.id)],
						color: palette.golden,
						notch: true,
						thumbnail: avatar(author.id)
					})
						.then(() => {

							confirmation.on(`collect`, async confmsg => {
								let confinput = confmsg.content.toLowerCase()

								//  Closing connections
								confmsg.delete()
								confirmation.stop()


								//  Returns if user asked to cancel the transaction
								if (!confinput.startsWith(`y`)) return reply(PAY.CANCELLED)
								//  Store target's artcoins balance
								await db(author.id).storeArtcoins(amount)
								//  Withdraw sender's artcoins balance
								await db(this.senderMeta.author.id).withdraw(amount, 52)


								//  Transaction successful
								reply(PAY.SUCCESSFUL, {color: palette.lightgreen})
								bot.logger.info(`[TRANSACTION] ${this.senderMeta.author.user.tag}(${commanifier(this.senderMeta.data.artcoins)} => ${commanifier(this.senderMeta.data.artcoins - amount)}) sent ${commanifier(amount)} ARTCOINS to ${author.user.tag}(${commanifier(data.artcoins)} => ${commanifier(data.artcoins + amount)})`)


								try {
									//  Notify target through dm
									return reply(PAY.TARGET_NOTIFICATION, {
										socket: [name(this.senderMeta.author.id), emoji(`artcoins`), commanifier(amount)],
										field: author
									})
								}
								//  Incase the target locked their dm, it will be handled here.
								catch(e) { return }
							})
						})
				})
			})
	}
}

module.exports.help = {
	start: Pay,
	name: `pay`,
	aliases: [`pay`, `transfer`, `transfers`, `share`],
	description: `Pay a specified user an amount of AC from your balance`,
	usage: `pay @user <amount>`,
	group: `shop`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}