const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/profile`)
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
    async execute({ reply, avatar, emoji, bot:{db} }) {
		await this.requestUserMetadata(2)
		//  Handle if user doesn't specify the new bio/description
		if (!this.fullArgs) return reply(this.locale.SETBIO.MISSING_ARG, {
			image: `banner_setbio`,
			socket:{prefix:this.bot.prefix}
		})
		//  Handle if user input is exceeding the character limit
		if (this.fullArgs.length > this.charactersLimit) return reply(this.locale.SETBIO.EXCEEDING_LIMIT, {
			socket: {
				emoji: emoji(`AnnieCry`),
				chars: this.fullArgs.length-this.charactersLimit
			}
		})
        this.user.main.bio = this.fullArgs
        this.rendering = await reply(this.locale.SETBIO.RENDERING, {
            simplified: true,
            socket: {emoji: emoji(`AAUloading`)} 
        })
        let img = await new GUI(this.user, this.bot, {width: 320, height: 360}, avatar).build()
        this.confirmation = await reply(this.locale.SETBIO.PREVIEW_CONFIRMATION, {
            prebuffer: true,
            image: img.toBuffer()
        })
        this.rendering.delete()
        this.addConfirmationButton(`applyBio`, this.confirmation)
        return this.confirmationButtons.get(`applyBio`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: emoji(`AnnieSleep`)}
			})
        	//  Perform update
        	await db.setUserBio(this.fullArgs, this.user.master.id)
        	this.finalizeConfirmation(r)
			return reply(``, {customHeader: [`Yay! your new profile's bio has been set!♡`, avatar(this.user.master.id)]})
        })
	}

}

module.exports.help = {
	start: SetBio,
	name: `setBio`,
	aliases: [`setdescrip`, `sd`, `sb`, `setbio`, `setdesc`, `setdescription`, `setprofiledescription`, `setprofiledesc`],
	description: `Set your profile bio/description`,
	usage: `setbio <Message>`,
	group: `Setting`,
	permissionLevel: 0,
	multiUser: false
}