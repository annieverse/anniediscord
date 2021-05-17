const Command = require(`../../libs/commands`)
/**
 * Buy any purchasable items in our shop!
 * @author klerikdust
 */
class Shop extends Command {

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
		return this.reply(this.locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji: await this.bot.getEmoji(`692428785571856404`)}})
	}
}

module.exports.help = {
	start: Shop,
	name: `shop`,
	aliases: [`shops`, `marketplace`, `market`],
	description: `Buy any purchasable items in our shop!`,
	usage: `shop`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}
