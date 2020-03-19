const Command = require(`../../libs/commands`)
/**
 * Displaying user's current balance
 * @author klerikdust
 */
class Balance extends Command {

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
	async execute({ reply, commanifier, avatar, emoji, bot:{locale}}) {
		await this.requestUserMetadata(2)
		return reply(locale.DISPLAY_BALANCE, {
			socket: [emoji(`artcoins`), commanifier(this.user.meta.artcoins)],
			notch: true,
			thumbnail: avatar(this.user.id)
		})
	}
}


module.exports.help = {
	start: Balance,
	name: `balance`,
	aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
	description: `Displaying user's current balance`,
	usage: `balance`,
	group: `General`,
	permissionLevel: 0,
	public: true,
	multiUser: true
}