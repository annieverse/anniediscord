const Command = require(`../../libs/commands`)
/**
 * Opens a Lucky Ticket and wins various exclusive rewards!
 * @author klerikdust
 */
class Gacha extends Command {

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
    async execute({ reply, emoji, name, trueInt, commanifier, loadAsset, bot:{db, locale:{GACHA}} }) {
    	await this.requestUserMetadata(2)

    	//  Handle if user doesn't have any lucky ticket to be opened.
    	if (!this.user.inventory.lucky_ticket) return reply(GACHA.NO_TICKET, {color: `red`})
    	let amount = this.args[0] ? trueInt(this.args[0]) : 1 
    	//  Handle if amount be opened is invalid
    	if (!amount) return reply(GACHA.INVALID_AMOUNT, {color: `red`, socket: [emoji(`AnnieCry`)]})
    	//  Handle if amount to be opened is higher than owned
    	if (this.user.inventory.lucky_ticket < amount) return reply(GACHA.INSUFFICIENT_TICKET, {
			socket: [emoji(`lucky_ticket`), this.user.inventory.lucky_ticket],
    		color: `red`
    	})
    	const rewardsPool = await db.getDroppableItems()
    	//  Handle if no rewards are available to be pulled from gacha.
    	if (!rewardsPool.length) return reply(GACHA.UNAVAILABLE_REWARDS, {socket: [emoji(`AnnieCry`)]})
    	this.message.delete()
    	return
    }
}

module.exports.help = {
	start: Gacha,
	name: `gacha`,
	aliases: [`multi-gacha`,`gacha`],
	description: `Opens a Lucky Ticket and wins various exclusive rewards such as covers, badges, gifts and even 5-star cards!`,
	usage: `gacha <Amount>`,
	group: `Shop`,
	permissionLevel: 0,
	multiUser: false
}