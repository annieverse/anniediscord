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
		const { message, command, reply, bot:{logger, user} } = this.stacks
		if (command.includes(`bot`)) {
			return reply(`[Invite Me!](https://discordapp.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot)`)
		}
		await message.channel.createInvite()
			.then(invite => {
				logger.info(`Created an invite with a code of ${invite.code}`)
				return reply(`https://discord.gg/${invite.code}`, { simplified: true })
			})
			.catch(error => logger.error(error))
	}
}
module.exports.help={
	start: ServerInvitation,
	name:`invite`,
	aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `link`, 
		`botserverinvite`, `botserverlink`, `botlinkserver`, `botinvitelink`, `botlink`, `botinvite`],
	description: `gives a server invite link`,
	usage: `invite`,
	group: `Server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}