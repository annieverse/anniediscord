const Command = require(`../../libs/commands`)
/**
 * Removes role from specific user.
 * @author klerikdust
 */
class RemoveRole extends Command {

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
    async execute({ reply, collector, name, removeRole, findRole, emoji }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user
		if (!this.fullArgs) return reply(this.locale.REMOVEROLE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		this.setSequence(5)
		reply(this.locale.REMOVEROLE.ROLE_SELECTION, {socket: {user: name(this.user.id)}, color: `golden`})
		.then(init => {
			this.sequence.on(`collect`, async msg => {
				const input = msg.content.toLowerCase()
				const role = findRole(input)

				/**
				 * ---------------------
				 * Sequence Cancellations.
				 * ---------------------
				 */
				if (this.cancelParameters.includes(input)) {
					this.endSequence()
					return reply(this.locale.ACTION_CANCELLED)
				}

				//  Handle if cannot find the role
				if (!role) return reply(this.locale.REMOVEROLE.NO_ROLE_FOUND, {color: `red`})
				//  Handle if user doesn't have the role
				if (!this.user._roles.includes(role.id)) return reply(this.locale.REMOVEROLE.DOESNT_HAVE_THE_ROLE, {
					socket: {user: name(this.user.id), emoji: emoji(`AnnieCry`)}, color: `red`
				})
				
				removeRole(role, this.user.id)
				reply(this.locale.REMOVEROLE.SUCCESSFUL, {
					color: `lightgreen`,
					socket: {
						role: role.name,
						user: name(this.user.id)
					}
				})
				init.delete()
				return this.endSequence()
			})
		})
	}
}

module.exports.help = {
	start: RemoveRole,
	name:`removeRole`,
	aliases: [`rmvrole`, `deleterolefrom`, `roleremove`, `rolerevoke`, `removerole`],
	description: `Removes role from specific user.`,
	usage: ` removerole <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}