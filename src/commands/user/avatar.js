const Command = require(`../../libs/commands`)
/**
 * Display user's avatar
 * @author klerikdust
 */
class Avatar extends Command {

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
	async execute({ reply, displayAvatar, bot:{locale} }) {
		await this.requestUserMetadata(1)
		if (!this.user) return reply(locale.ERR.UNABLE_TO_FIND_USER)
		return displayAvatar(this.user.id)
	}
}


module.exports.help = {
	start: Avatar,
	name: `avatar`,
	aliases: [`ava`, `pfp`],
	description: `Display user's avatar`,
	usage: `avatar <user>`,
	group: `Fun`,
	permissionLevel: 0,
	public: true,
	multiUser: true
}