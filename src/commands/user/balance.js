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
	async execute({ reply, commanifier, avatar, emoji}) {
		await this.requestUserMetadata(2)
		//  Handle if user couldn't be found
		if (!this.user) return reply(this.locale.USER.IS_INVALID)
		return reply(this.locale.DISPLAY_BALANCE, {
			thumbnail: avatar(this.user.id),
			socket: {
				emoji: emoji(`artcoins`), 
				amount: commanifier(this.user.inventory.artcoins || 0),
				tips: this.user.isSelf ? `Use **\`${this.bot.prefix}pay\`** to share with friends!` : ` `
			}
		})
	}
}


module.exports.help = {
	start: Balance,
	name: `balance`,
	aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
	description: `Displaying user's current balance`,
	usage: `balance`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}