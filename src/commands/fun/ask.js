const Command = require(`../../libs/commands`)
/**
 * You can ask any question and Annie will answer you.
 * @author klerikdust
 */
class Ask extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		if (!this.fullArgs) return this.reply(this.locale.ASK.SHORT_GUIDE)
        const pool = this.locale.ASK.ANSWERS
		return this.reply(pool[Math.floor(Math.random() * pool.length)])
	}
}


module.exports.help = {
	start: Ask,
	name: `ask`,
	aliases: [`8ball`],
	description: `You can ask any question and Annie will answer you.`,
	usage: `ask <Message>`,
	group: `Fun`,
	permissionLevel: 0,
	multiUser: false
}
