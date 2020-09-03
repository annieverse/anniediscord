const Command = require(`../../libs/commands`)
/**
 * Takes all expired event ticket from participants
 * @author klerikdust
 */
class EndEvent extends Command {

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
    async execute({ reply, findRole, name }) {
		await this.requestUserMetadata(1)
		
		//  Filter command to only working in AAU.
		if (this.message.guild.id != `459891664182312980`) return

		const ticket = findRole(`Event Participant`)
		const participants = ticket.members.map(m => m.user.id)

		//  Returns if no ghosting participants left
		if (participants.length < 1) return reply(this.locale.EVENT.END_NOPARTICIPANTLEFT, {socket: {user: name(this.user.id)} })
		//  Removing tickets
		for (let i = 0; i < participants.length; i++) {
			await this.message.guild.members.cache.get(participants[i]).roles.remove(ticket)
		}
		//  Successful!
		return reply(this.locale.EVENT.END, {socket: {participants: participants.length}, color: `lightgreen`})
	}
}
    
module.exports.help = {
	start: EndEvent,
	name:`endEvent`,
	aliases: [`endevent`, `eventend`],
	description: `Takes all expired event ticket from participants`,
	usage: `eventend`,
	group: `System`,
	permissionLevel: 2,
	multiUser: false
}