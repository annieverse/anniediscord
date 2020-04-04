const Command = require(`../../libs/commands`)
const ms = require(`ms`)
/**
 * Mutes a user
 * @author klerikdust
 */
class Mute extends Command {

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
    async execute({ reply, name, addRole, removeRole, schedule, collector, bot:{locale:{MUTE}} }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user to be muted
		if (!this.fullArgs) return reply(MUTE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(MUTE.INVALID_USER, {color: `red`})

		const sequenceOne = collector(this.message)
		sequenceOne.on(`collect`, async inputOne => {
			const time = ms(inputOne.content)
			sequenceOne.stop()

			//  Handle if input time is not a valid date
			if (!time) return reply(MUTE.INVALID_DATE, {color: `red`})

			//  Lookup into available mute role in the guild
			let muteRole = this.message.guild.roles.find(r => (r.name === `muted`) || (r.name === `mute`))
			//  If mute role hasn't been made yet, create one.
			if (!muteRole) {
				try {
					muteRole = await this.message.guild.createRole({
						name: `muted`,
						color: `#000000`,
						permissions: []
					})
					this.message.guild.channels.forEach(async channel => {
						await channel.overwritePermissions(muterole, {
							SEND_MESSAGES: false,
							ADD_REACTIONS: false,
							SEND_TTS_MESSAGES: false,
							ATTACH_FILES: false,
							SPEAK: false
						})
					})
				} catch (e) {
					this.logger.error(`Failed to create mute role. > `, e)
				}
			}

			addRole(muteRole, this.user.id)
			reply(MUTE.SUCCESSFUL, {socket: [name(this.user.id), inputOne.content], color: `lightgreen`})
			schedule(time, removeRole(muteRole, this.user.id))
		})
	}
}

module.exports.help = {
	start: Mute,
	name:`mute`,
	aliases: [`silent`, `silence`],
	description: `Mutes a user`,
	usage: `mute <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}
