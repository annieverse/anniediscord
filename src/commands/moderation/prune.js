const Command = require(`../../libs/commands`)
/**
 * Deletes up to 100 messages.
 * @author klerikdust
 */
class Prune extends Command {

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
    async execute({ reply, trueInt, deleteMessages, emoji }) {
		
		//	Returns if user doesn't specify the amount of message to be deleted
		if (!this.args[0]) return reply(this.locale.PRUNE.SHORT_GUIDE)
		let amount = trueInt(this.args[0])
		//	Returns if inputted value is invalid
		if (!amount) return reply(this.locale.PRUNE.INVALID_AMOUNT)
		//	Returns if inputted value is exceeding the limit(100)
		if (amount > 100) return reply(this.locale.PRUNE.EXCEEDING_LIMIT)
		//	Delete a requested amount of messages.
		deleteMessages(amount + 1)
		//	Successful
		return reply(this.locale.PRUNE.SUCCESSFUL, {
			socket: {amount: amount, emoji: await emoji(`781504248868634627`)},
			deleteIn: 5
		})
	}
}

module.exports.help = {
	start: Prune,
	name: `prune`,
	aliases: [`deletemsg`, `prunemsg`],
	description: `Deletes up to 100 messages.`,
	usage: `prune <Amount>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: false
}