const Command = require(`../../libs/commands`)
/**
 * Ban a user permanently from server.
 * @author klerikdust
 */
class Ban extends Command {

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
    async execute({ reply, name, bot:{locale:{BAN}} }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target
		if (!this.fullArgs) return reply(BAN.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(BAN.TARGET_DOESNT_EXISTS, {color: `red`})
		//  Handle if target user permission is equal to admin privilege
		if (this.user.hasPermission(`ADMINISTRATOR`)) return reply(BAN.TARGET_HAS_ADMIN_PRIVILEGE, {color: `red`})

		await this.message.guild.member(this.user).ban()
		return reply(BAN.SUCCESSFUL, {socket: [name(this.user.id)], color: `lightgreen`})
	}
}

module.exports.help={
	start: Ban,
	name:`ban`,
	aliases: [`hammer`, `bwans`, `bun`],
	description: `Ban a user permanently from server.`,
	usage: `ban <User>`,
	group: `Moderation`,
	permissionLevel: 3,
	multiUser: true
}