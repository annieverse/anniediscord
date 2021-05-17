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
     * @return {void}
     */
    async execute() {
		await this.requestUserMetadata(2)
		//  Handle if user doesn't specify the new bio/description
		if (!this.fullArgs) return this.reply(this.locale.SETBIO.MISSING_ARG, {
			image: `banner_setbio`,
			socket:{prefix:this.bot.prefix}
		})
		//  Handle if user input is exceeding the character limit
		if (this.fullArgs.length > this.charactersLimit) return this.reply(this.locale.SETBIO.EXCEEDING_LIMIT, {
			socket: {
				emoji: await this.bot.getEmoji(`692428578683617331`),
				chars: this.fullArgs.length-this.charactersLimit
			}
		})
        this.user.main.bio = this.fullArgs
        this.rendering = await this.reply(this.locale.SETBIO.RENDERING, {
            simplified: true,
            socket: {emoji: await this.bot.getEmoji(`790994076257353779`)} 
        })
        let img = await new GUI(this.user, this.bot, {width: 320, height: 360}).build()
        this.confirmation = await this.reply(this.locale.SETBIO.PREVIEW_CONFIRMATION, {
            prebuffer: true,
            image: img.toBuffer()
        })
        this.rendering.delete()
        await this.addConfirmationButton(`applyBio`, this.confirmation)
        return this.confirmationButtons.get(`applyBio`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
        	//  Perform update
            this.bot.db.setUserBio(this.fullArgs, this.user.master.id)
        	this.finalizeConfirmation(r)
			return this.reply(``, {customHeader: [`Yay! your new profile's bio has been set!♡`, this.user.master.displayAvatarURL()]})
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
