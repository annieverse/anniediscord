const Command = require(`../../libs/commands`)
/**
 * Sends a direct message to specified user
 * @author klerikdust
 */
class Mail extends Command {

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
    async execute({ reply, name, collector, bot:{locale:{MAIL}} }) {
		await this.requestUserMetadata(1)

		//  Returns as guide if user doesn't specify any parameter.
		if (!this.fullArgs) return reply(MAIL.SHORT_GUIDE)
		//  Returns if target user is invalid.
		if (!this.user) return reply(MAIL.INVALID_USER, {color: `red`})

		//  Confirmation message.
		reply(MAIL.PROMPT, {socket: [name(this.user.id)], color: `golden`})

		const collect = collector(this.message)
		collect.on(`collect`, msg => {
			//  Close connection
			collect.stop()
			//  Handle if user tries to cancel the message forwarding
			if ([`cancel`, `n`, `no`].includes(msg.content.toLowerCase())) return reply(MAIL.CANCELLED)

			try {
				//  Send message to target
				reply(msg.content, {field: this.user})
				//  Show notification if message has been successfully delivered.
				return reply(MAIL.SUCCESSFUL, {socket: [name(this.user.id)], color: `lightgreen`})
			}
			catch(e) {
				//  Handles the error caused by locked dms setting.
				return reply(MAIL.UNSUCCESSFUL, {color: `red`})
			}
		})
	}
}

module.exports.help = {
	start: Mail,
	name: `mail`,
	aliases: [`dm`],
	description: `Sends a direct message to specified user`,
	usage: `mail <User>`,
	group: `Moderation`,
	permissionLevel: 3,
	multiUser: true
}