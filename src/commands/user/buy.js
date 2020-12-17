const Command = require(`../../libs/commands`)
/**
 * Buy any purchasable items our shop!
 * @author klerikdust
 */
class Buy extends Command {

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
		return reply(this.locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji:emoji(`AnniePeek2`)}})
	}
}

module.exports.help = {
	start: Buy,
	name: `buy`,
	aliases: [`purchase`, `buyy`],
	description: `Buy any purchasable items in our shop!`,
	usage: `buy <ItemID/ItemName>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}