const Command = require(`../../libs/commands`)
/**
 * Adds role to specific user.
 * @author klerikdust
 */
class AddRole extends Command {

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
    async execute({ reply, name, avatar, addRole, findRole }) {
		await this.requestUserMetadata(2)

		//  Handle if user doesn't specify the target user
		if (!this.fullArgs) return reply(this.locale.ADDROLE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		this.setSequence(10)
		reply(this.locale.ADDROLE.CONFIRMATION_SEQ_1, {
			color: `golden`,
			socket: {user: name(this.user.id)}
		})
		.then(init => {
			this.sequence.on(`collect`, async msg => {
				const input = msg.content.toLowerCase()

				/**
				 * ---------------------
				 * Sequence Cancellations.
				 * ---------------------
				 */
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(this.locale.ACTION_CANCELLED)
				}

				/**
				 * ---------------------
				 * 1.) Choosing role.
				 * ---------------------
				 */
				if (this.onSequence <= 1) {
					this.role = findRole(input)
					//  Handle if cannot find the role
					if (!this.role) return reply(this.locale.ADDROLE.NO_ROLE_FOUND, {color: `red`})
					//  Handle if user already have the role
					if (this.user._roles.includes(this.role.id)) return reply(this.locale.ADDROLE.HAS_ROLE_ALREADY, {
						color: `red`,
						socket: {user: name(this.user.id)}
					})
					reply(this.locale.ADDROLE.CONFIRMATION_SEQ_2, {
						socket: {
							role: this.role.name,
							user: name(this.user.id)
						},
						thumbnail: avatar(this.user.id),
						color: `golden`,
						notch: true
					})
					init.delete()
					return this.nextSequence()
				}

				/**
				 * ---------------------
				 * 2.) Finalize.
				 * ---------------------
				 */
				if (this.onSequence <= 2) {
					if (!input.startsWith(`y`)) return reply(this.locale.ADDROLE.CANCEL)
					await addRole(this.role, this.user.id)
					reply(this.locale.ADDROLE.ROLE_ADDED, {color: `lightgreen`})
					input.delete()
					return this.endSequence()
				}
			})
		})
	}
}

module.exports.help = {
	start: AddRole,
	name: `addRole`,
	aliases: [`assignrole`, `addrole`, `giverole`, `roleadd`, `rolegive`, `roleassign`],
	description: `Adds role to specific user.`,
	usage: `addrole <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}
