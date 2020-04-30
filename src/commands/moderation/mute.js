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
    async execute({ reply, name, addRole, removeRole, emoji }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user to be muted
		if (!this.fullArgs) return reply(this.locale.MUTE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		this.setSequence()
		reply(this.locale.MUTE.DURATION, {color: `golden`})
		.then(async confirmation => {
			this.sequence.on(`collect`, async msg => {
				const input = msg.content.toLowerCase()
				const time = ms(input)

				/**
				 * ---------------------
				 * Sequence Cancellations.
				 * ---------------------
				 */
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(this.locale.ACTION_CANCELLED)
				}


				//  Handle if input time is not a valid date
				if (!time) return reply(this.locale.MUTE.INVALID_DATE, {color: `red`})
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
							await channel.overwritePermissions(muteRole, {
								SEND_MESSAGES: false,
								ADD_REACTIONS: false,
								SEND_TTS_MESSAGES: false,
								ATTACH_FILES: false,
								SPEAK: false
							})
						})
					} 
					catch (e) {
						this.logger.error(`Failed to create mute role. > `, e)
					}
				}
	
				addRole(muteRole, this.user.id)
				reply(this.locale.MUTE.SUCCESSFUL, {
					color: `lightgreen`,
					socket: {
						user: name(this.user.id),
						duration: input,
						emoji: emoji(`AnnieYandere`)
					}
				})
				this.endSequence()
				setTimeout(() => {
					removeRole(muteRole, this.user.id)
				}, time)
			})
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
