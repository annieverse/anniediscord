const Command = require(`../../libs/commands`)
/**
 * Set user's profile bio/description
 * @author klerikdust
 */
class SetBio extends Command {
    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.charactersLimit = 156
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     */
    async execute({ reply, bot:{db} }) {
		await this.requestUserMetadata(2)

		//  Handle if user doesn't specify the new bio/description
		if (!this.fullArgs) return reply(this.locale.SETBIO.MISSING_ARG, {color: `red`})
		//  Handle if user input is exceeding the character limit
		if (this.fullArgs.length > this.charactersLimit) return reply(this.locale.SETBIO.EXCEEDING_LIMIT, {color: `red`})

		await db.setUserBio(this.fullArgs, this.user.id)
		return reply(this.locale.SETBIO.SUCCESSFUL, {color: `lightgreen`})
	}

}

module.exports.help = {
	start: SetBio,
	name: `setProfileDescription`,
	aliases: [`setdescrip`, `sd`, `sb`, `setbio`, `setdesc`, `setdescription`, `setprofiledescription`, `setprofiledesc`],
	description: `Set your profile bio/description`,
	usage: `setbio <Message>`,
	group: `Setting`,
	permissionLevel: 0,
	multiUser: false
}