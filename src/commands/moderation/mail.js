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
    async execute({ reply, name, emoji }) {
		await this.requestUserMetadata(1)

		//  Returns as guide if user doesn't specify any parameter.
		if (!this.fullArgs) return reply(this.locale.MAIL.SHORT_GUIDE)
		//  Returns if target user is invalid.
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		reply(this.locale.MAIL.PROMPT, {socket: {user: name(this.user.id)}, color: `golden`})
		this.setSequence(3, 300000)
		this.sequence.on(`collect`, async msg => {
			const input = msg.content.toLowerCase()

			/**
			 * ---------------------
			 * Sequence Cancellations.
			 * ---------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			/**
			 * ---------------------
			 * 1.) Sends message to target
			 * ---------------------
			 */
			try {
				reply(msg.content, {field: this.user})
				reply(this.locale.MAIL.SUCCESSFUL, {
					color: `lightgreen`,
					socket: {user: name(this.user.id)}
				})
				return this.endSequence()
			}

			/**
			 * ---------------------
			 * Handles error caused by locked dm setting.
			 * ---------------------
			 */
			catch(e) {
				reply(this.locale.MAIL.UNSUCCESSFUL, {socket: {emoji: emoji(`AnnieCry`)}, color: `red`})
				this.endSequence()
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