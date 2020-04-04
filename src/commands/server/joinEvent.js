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
    async execute({ reply, addRole, findRole, name, bot:{db, locale:{EVJOIN}} }) {
		await this.requestUserMetadata(2)

		//  Filter command to only working in AAU.
		if (!this.message.guild.id != `459892609838481408`) return

		const eventRole = findRole(`Event Participant`)
		//  Returns if user already have the ticket.
		if (this.user._roles.includes(eventRole.id)) return reply(EVJOIN.ALREADY_HAS, {socket: [name(author.id)]})
		//  Returns if user's balance doesn't meet the minimum fee requirement.
		if (this.user.meta.artcoins < this.fee) return reply(EVJOIN.INSUFFICIENT_BALANCE, {color: `red`})
		//  Deduct user's balance if user hadn't foxie card
		if (!this.user.meta.foxie_card) await db.updateInventory({
			itemId: 52,
			value: this.fee,
			operation:`-`,
			userId: this.user.id
		})

		//  Assign role to the user
		addRole(eventRole, this.user.id)
		return reply(EVJOIN.SUCCESSFUL, {
			socket: [name(this.user.id), EVJOIN.FOXIES_BLESSING, emoji(`AnnieHype`)],
			color: this.user.meta.foxie_card ? `pink` : `golden`,
			notch:  this.user.meta.foxie_card ? true : false,
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