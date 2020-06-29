const Command = require(`../../libs/commands`)
/**
 * Generates Server & Bot invitation link
 * @author klerikdust
 */
class Invite extends Command {

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
	async execute({ reply, emoji, bot:{user, supportServer} }) {
		try {
			//attempt to send to dm
			await reply(this.locale.GENERATE_BOT_INVITE, {
				socket: {botInviteLink: `[Let's add me to your server!](https://discordapp.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot)`},
				color: `crimson`,
				field: this.message.author
			})
	
			return reply(this.locale.GENERATE_SERVER_INVITE, {
				simplified: true,
				socket: {
					serverLink: `• ${supportServer}\n• https://discord.gg/n3B9tK7`,
					emoji: emoji(`AnnieSmile`)
				},
				field: this.message.author
			})
		} catch (error) {
			// Send to channel if failed send attempt to dm
			await reply(this.locale.GENERATE_BOT_INVITE, {
				socket: {botInviteLink: `[Let's add me to your server!](https://discordapp.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot)`},
				color: `crimson`
			})

			return reply(this.locale.GENERATE_SERVER_INVITE, {
				simplified: true,
				socket: {
					serverLink: `• ${supportServer}\n• https://discord.gg/n3B9tK7`,
					emoji: emoji(`AnnieSmile`)
				}
			})
		}
	}
}

module.exports.help={
	start: Invite,
	name:`invite`,
	aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `invite`],
	description: `Generates Server & Bot invitation link`,
	usage: `invite <Bot>(Optional)`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}