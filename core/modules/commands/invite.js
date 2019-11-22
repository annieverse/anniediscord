/**
 * Main module
 * @ServerInvitation as one-type command to server invite link.
 */
class ServerInvitation {
	constructor(Stacks) {
		this.stacks = Stacks
	}

    /**
     *  Initializer method
     */
	async execute() {
		const { message, reply, logger } = this.stacks
		await message.channel.createInvite()
			.then(invite => {
				logger.info(`Created an invite with a code of ${invite.code}`)
				return reply(`https://discord.gg/${invite.code}`, { simplified: true })
			})
			.catch(logger.error)
	}
}
module.exports.help={
	start: ServerInvitation,
	name:`invite`,
	aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `link`],
	description: `gives a server invite link`,
	usage: `invite`,
	group: `Server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}