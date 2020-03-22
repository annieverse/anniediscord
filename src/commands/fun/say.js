const Command = require(`../../libs/commands`)
/**
 * Talk through bot.
 * @author klerikdust
 */
class Say extends Command {

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
	async execute({ reply, name, bot:{locale:{SAY}} }) {
		await this.requestUserMetadata(1)

		//	Displaying short-guide if user doesn't specify any message to send.
		if (!this.fullArgs) return reply(SAY.SHORT_GUIDE, {socket: [name(this.user.id)]})
		//	Spying mode. FAYAHHHH!
		this.message.delete()
		return reply(this.fullArgs, {color: `crimson`})
	}

}

module.exports.help = {
	start: Say,
	name: `say`,
	aliases: [],
	description: `Talk through bot.`,
	usage: `say <message>`,
	group: `Admin`,
	permissionLevel: 3,
	public: true,
	multiUser: false
}