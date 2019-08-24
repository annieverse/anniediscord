

/**
 * Main module
 * @eventEnds Take all expired tickets from event participant.
 */
class eventEnds {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     *	Initializer method
     */
	async execute() {
		const { isEventManager, message, code, name, reply, meta: {author} } = this.stacks

		let metadata = {
			rest_participants: message.guild.roles.find(r => r.name === `Event Participant`).members.map(m => m.user.id),
			ticket: message.guild.roles.find(r => r.name === `Event Participant`)
		}

		//  Returns if user has no event manager authority
		if (!isEventManager) return reply(code.EVENTMANAGER_UNAUTHORIZED_ACCESS)

		//  Returns if no dead participants left
		if (metadata.rest_participants.length < 1) return reply(code.EVENT.END_NOPARTICIPANTLEFT, {
			socket: [name(author.id)]
		})
        
		//  Removing tickets
		for (let i = 0; i < metadata.rest_participants.length; i++) {
			await message.guild.members.get(metadata.rest_participants[i]).removeRole(metadata.ticket)
		}

        
		//  Successful!
		return reply(code.EVENT.END, {socket: [metadata.rest_participants.length]})

	}
}
    
module.exports.help = {
	start: eventEnds,
	name:`serverEventEnds`,
	aliases: [`eventend`],
	description: `Take all expired tickets from event participant`,
	usage: `eventend`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}