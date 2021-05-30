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
        this.supportServerUrl = `https://discord.gg/7nDes9P` 
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		try {
			//  Attempt to send through DM.
			await this.sendInvites(this.message.author)
			return this.reply(this.locale.INVITE_LINK_SENT, {status: `success`, socket:{ emoji:`:e_mail:` }})
		} catch (error) {
			// Send to channel if failed send attempt to dm
			return this.sendInvites(this.message.channel)
		}
	}

    /**
     * Default template for sending invites.
     * @param {object} [targetChannel={}] target channel to be sent in..
     * @returns {void}
     */
	async sendInvites(targetChannel={}) {
		await this.reply(this.locale.GENERATE_BOT_INVITE, {
			socket: {botInviteLink: `[Let's add me to your server!](${this.botInviteUrl})`},
			field: targetChannel
		})
		await this.reply(this.locale.GENERATE_SERVER_INVITE, {
			simplified: true,
			socket: {
				serverLink: this.supportServerUrl,
				emoji: await this.bot.getEmoji(`692428927620087850`)
			},
			field: targetChannel
		})
	}
}

module.exports.help={
	start: Invite,
	name:`invite`,
	aliases: [`serverinvite`, `serverlink`, `linkserver`, `invitelink`, `invite`, `botinvite`, `invitebot`],
	description: `Generates Support Server & Bot Invitation link`,
	usage: `invite`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}
