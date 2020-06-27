const Command = require(`../../libs/commands`)
/**
 * Grants you event ticket so you are able to submit event submission.
 * This command currently only available in AAU.
 * @author klerikdust
 */
class JoinEvent extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.fee = 250
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, addRole, emoji, findRole, name, bot:{db} }) {
		await this.requestUserMetadata(2)

		//  Filter command to only working in AAU.
		if (this.message.guild.id != `459891664182312980`) return
		
		const eventRole = findRole(`Event Participant`)
		//  Returns if user already have the ticket.
		if (this.user._roles.includes(eventRole.id)) return reply(this.locale.EVJOIN.ALREADY_HAS, {socket: {user: name(this.user.id)} })
		//  Returns if user's balance doesn't meet the minimum fee requirement.
		if (this.user.inventory.artcoins < this.fee) return reply(this.locale.EVJOIN.INSUFFICIENT_BALANCE, {color: `red`})
		//  Deduct user's balance if user hadn't foxie card
		const hasFoxieCard = this.user.inventory.foxie_card
		if (!hasFoxieCard) await db.updateInventory({
			itemId: 52,
			value: this.fee,
			operation:`-`,
			userId: this.user.id
		})

		//  Assign role to the user
		addRole(eventRole, this.user.id)
		return reply(this.locale.EVJOIN.SUCCESSFUL, {
			socket: {
				user: name(this.user.id),
				foxieMessage: this.locale.EVJOIN.FOXIES_BLESSING,
				emoji: emoji(`AnnieHype`)
			},
			color: hasFoxieCard ? `pink` : `lightgreen`,
			notch: hasFoxieCard ? true : false,
		})
	}
}
       
module.exports.help = {
	start: JoinEvent,
	name:`joinEvent`,
	aliases: [`join`, `joinevent`, `enterevent`],
	description: `AAU's Exclusive Command. 250 Artcoins fee will be deducted once joined the server event.`,
	usage: `join`,
	group: `Server`,
	permissionLevel: 0,
	multiUser: false
}