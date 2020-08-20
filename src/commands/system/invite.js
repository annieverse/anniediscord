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
		this.permmissionInteger = 268823638
		this.botInviteUrl = `https://discord.com/oauth2/authorize?client_id=${this.bot.user.id}&permissions=${this.permmissionInteger}&scope=bot`
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji, messageGuildInvite, bot:{user, supportServer} }) {
		this.tools = {reply, emoji, user, supportServer, messageGuildInvite}
		try {
			//  Attempt to send through DM.
			await this.sendInvites(this.message.author,...arguments)
			return reply(this.locale.INVITE_LINK_SENT, {color: `lightgreen`, socket:{ emoji:`:e_mail:` }})
		} catch (error) {
			// Send to channel if failed send attempt to dm
			return this.sendInvites(this.message.channel,...arguments)
		}
	}

    /**
     * Default template for sending invites.
     * @param {object} [targetChannel={}] target channel to be sent in..
     * @returns {void}
     */
	async sendInvites(targetChannel={},{reply}) {
		await reply(this.locale.GENERATE_BOT_INVITE, {
			socket: {botInviteLink: `[Let's add me to your server!](${this.botInviteUrl})`},
			color: `crimson`,
			field: targetChannel
		})
		await reply(this.locale.GENERATE_SERVER_INVITE, {
			simplified: false,
			socket: {
				serverLink: `• [Support Server](${this.tools.supportServer})\n• [${this.message.guild.name} Server](${await this.tools.messageGuildInvite()})`,
				emoji: this.tools.emoji(`AnnieSmile`)
			},
			field: targetChannel
		})
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