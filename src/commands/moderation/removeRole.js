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
    async execute({ reply, collector, name, removeRole, findRole, bot:{locale:{REMOVEROLE}} }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user
		if (!this.fullArgs) return reply(REMOVEROLE.MISSING_ARG)
		//  Handle if target user doesn't exists
		if (!this.user) return reply(REMOVEROLE.NO_USER_FOUND, {color: `red`})

		/** --------------------------
		 *  Role Selection
		 *  --------------------------
		 */
		reply(REMOVEROLE.ROLE_SELECTION, {socket: [name(this.user.id)], color: `golden`})
		.then(sequenceOne => {
			const seqOne = collector(this.message)
			seqOne.on(`collect`, async input => {
				sequenceOne.delete()
				const role = findRole(input.content.toLowerCase())

				//  Handle if cannot find the role
				if (!role) {
					seqOne.stop()
					return reply(REMOVEROLE.NO_ROLE_FOUND, {color: `red`})
				}
				//  Handle if user doesn't have the role
				if (!this.user._roles.includes(role.id)) {
					seqOne.stop()
					return reply(REMOVEROLE.DOESNT_HAVE_THE_ROLE, {socket: [name(this.user.id)], color: `red`})
				}
				
				seqOne.stop()
				removeRole(role, this.user.id)
				return reply(REMOVEROLE.SUCCESSFUL, {socket: [role.name, name(this.user.id)], color: `lightgreen`})

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