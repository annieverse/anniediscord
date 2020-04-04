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
    async execute({ reply, findRole, name, bot:{locale:{EVENT}} }) {
		await this.requestUserMetadata(1)
		
		//  Filter command to only working in AAU.
		if (!this.message.guild.id != `459892609838481408`) return

		const ticket = findRole(`Event Participant`)
		const participants = ticket.members.map(m => m.user.id)

		//  Returns if no ghosting participants left
		if (participants.length < 1) return reply(EVENT.END_NOPARTICIPANTLEFT, {socket: [name(this.user.id)]})
		//  Removing tickets
		for (let i = 0; i < participants.length; i++) {
			await this.message.guild.members.get(participants[i]).removeRole(ticket)
		}
		//  Successful!
		return reply(EVENT.END, {socket: [participants.length], color: `lightgreen`})
	}
}
    
module.exports.help = {
	start: EndEvent,
	name:`eventend`,
	aliases: [`endevent`, `eventend`],
	description: `Takes all expired event ticket from participants`,
	usage: `eventend`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: false
}