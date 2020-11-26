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
	async execute({ reply, displayAvatar }) {
		await this.requestUserMetadata(1)
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		this.avatarInit = await reply(this.locale.AVATAR.INITIAL)
		await this.delay(1750)
		this.avatarInit.delete()
		return displayAvatar(this.user.id)
	}

	/**
	 * Set a time delay
	 * @param {number} [ms=0]
	 * @return {promise}
	 */
	async delay(ms=0) {
		return new Promise(res => setTimeout(res, ms))
	}
}


module.exports.help = {
	start: Avatar,
	name: `avatar`,
	aliases: [`ava`, `pfp`],
	description: `Display user's avatar`,
	usage: `avatar <user>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}