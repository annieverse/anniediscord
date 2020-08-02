const Command = require(`../../libs/commands`)
/**
 * Mutes a user
 * @author Pan
 */
class UnMute extends Command {

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
    async execute({ reply, removeRole }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user to be muted
		if (!this.fullArgs) return reply(this.locale.UNMUTE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		//  Lookup into available mute role in the guild
		let muteRole = this.message.guild.roles.find(r => (r.name === `muted`) || (r.name === `mute`))
		if (this.bot.mute_role) muteRole = this.message.guild.roles.find(r => (r.id == this.bot.mute_role))
		//  If mute role hasn't been made yet, create one.
		if (!muteRole) {
			return reply(this.locale.MUTE.NO_MUTE_ROLE)
		}
		removeRole(muteRole, this.user.id)
	}
}

module.exports.help = {
	start: UnMute,
	name:`unmute`,
	aliases: [],
	description: `unmutes a user`,
	usage: `unmute <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}
