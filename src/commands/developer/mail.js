const Command = require(`../../libs/commands`)
/**
 * Allows developer to send a private message to reachable user.
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
	async execute({ reply, emoji }) {
		await this.requestUserMetadata(1)
		if (!this.user) return reply(`Sadly, the user is unreachable`)
		//  Handle if user doesn't specify any arg
        const mailContent = this.message.content
            .toLowerCase()
            .split(` `)
            .slice(2)
            .join(` `)
		if (!mailContent) return reply(`Who you want me to send DM to? ${await emoji(`AnnieThinking`)}`)
		const confirmation = await reply(`I'm going to send **${this.user.master}** the following message.\n\`\`\`\n${mailContent}\n\`\`\``)
		await this.addConfirmationButton(`send_mail`, confirmation)
 		return this.confirmationButtons.get(`send_mail`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
			try {
				await reply(mailContent, {
					field: this.user.master,
					footer: `This system message is sent by the developer.`
				})
				this.finalizeConfirmation(r)
				return reply(`The mail is successfully sent!`)
			}
			catch(e) {
				this.logger.warn(`[DEVKIT_DM] USER_ID:${this.user.master.id} > ${e.message}`)
				return reply(`Unfortunately I can't forward the email due to locked DM.`)
			}
		})
	}
}

module.exports.help = {
	start: Mail,
	name: `mail`,
	aliases: [`mail`, `dm`],
	description: `Allows developer to send a private message to reachable user`,
	usage: `<user> <message>`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: true
}
