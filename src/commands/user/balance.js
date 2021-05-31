const Command = require(`../../libs/commands`)
const commanifier = require(`../../utils/commanifier`)
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
     * @return {void}
     */
	async execute() {
		await this.requestUserMetadata(2)
		//  Handle if user couldn't be found
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		return this.reply(this.locale.DISPLAY_BALANCE, {
			thumbnail: this.user.master.displayAvatarURL(),
			socket: {
				emoji: await this.bot.getEmoji(`758720612087627787`), 
				amount: commanifier(this.user.inventory.artcoins || 0),
				tips: this.user.master.id === this.message.author.id ? `Use **\`${this.bot.prefix}pay\`** to share with friends!` : ` `
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
