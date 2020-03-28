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
    async execute({ reply, collector, multiCollector, name, avatar, addRole, findRole, bot:{locale:{ADDROLE}} }) {
		await this.requestUserMetadata(1)

		//  Handle if user doesn't specify the target user
		if (!this.fullArgs) return reply(ADDROLE.MISSING_ARG, {color: `red`})
		//  Handle if target user doesn't exists
		if (!this.user) return reply(ADDROLE.NO_USER_FOUND, {color: `red`})

		/** --------------------------
		 *  Role Selection
		 *  --------------------------
		 */
		reply(ADDROLE.CONFIRMATION_SEQ_1, {socket: [name(this.user.id)], color: `golden`})
		.then(sequenceOne => {
			const seqOne = collector(this.message)
			seqOne.on(`collect`, async input => {
				const role = findRole(input.content.toLowerCase())

				//  Handle if cannot find the role
				if (!role) {
					seqOne.stop()
					sequenceOne.delete()
					return reply(ADDROLE.NO_ROLE_FOUND, {color: `red`})
				}
				//  Handle if user already have the role
				if (this.user._roles.includes(role.id)) {
					seqOne.stop()
					sequenceOne.delete()
					return reply(ADDROLE.HAS_ROLE_ALREADY, {socket: [name(this.user.id)], color: `red`})
				}

				seqOne.stop()
				sequenceOne.delete()

			
				/** --------------------------
				 *  Confirmation - Sequence End
				 *  --------------------------
				 */
				return reply(ADDROLE.CONFIRMATION_SEQ_2, {
					socket: [role.name, name(this.user.id)],
					thumbnail: avatar(this.user.id),
					color: `golden`,
					notch: true
				})
				.then(sequenceTwo => {
					const seqTwo = multiCollector(input)
					seqTwo.on(`collect`, async secondInput => {
						
						//  Handle if user has cancelled the assigment
						if (!secondInput.content.toLowerCase().startsWith(`y`)) {
							secondInput.delete()
							sequenceTwo.delete()
							seqTwo.stop()
							return reply(ADDROLE.CANCEL)
						}

						secondInput.delete()
						sequenceTwo.delete()
						seqTwo.stop()
						await addRole(role.id, this.user.id)
						return reply(ADDROLE.ROLE_ADDED, {color: `lightgreen`})
					})
				})
			})
		})
	}
}

module.exports.help = {
	start: AddRole,
	name: `addRole`,
	aliases: [`assignrole`, `addrole`, `giverole`, `roleadd`, `rolegive`, `roleassign`],
	description: `Add role to specific user.`,
	usage: `addrole <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}
