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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji }) {
		await this.requestUserMetadata(1)
		//  Temporary close
		return reply(this.locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji: await emoji(`692428785571856404`)}})
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
