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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, choice, bot:{locale:{ASK}} }) {
		//  Returns if no question was specified.
		if (!this.fullArgs) return reply(ASK.SHORT_GUIDE)
		//  Finishing answer.
		return reply(choice(ASK.ANSWERS))
	}
}


module.exports.help = {
	start: Ask,
	name: `ask`,
	aliases: [],
	description: `You can ask any question and Annie will answer you.`,
	usage: `ask <message>`,
	group: `Fun`,
	permissionLevel: 0,
	public: true,
	multiUser: false
}