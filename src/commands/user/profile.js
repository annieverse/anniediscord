const GUI = require(`../../ui/prebuild/profile`)
const Command = require(`../../libs/commands`)
/**
 * Displaying user's profile card!
 * @author klerikdust
 */
class Profile extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        await this.requestUserMetadata(2)
        //  Handle if user doesn't exists
        if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
        const fetching = await this.reply(this.locale.PROFILECARD.FETCHING, {
            socket: {emoji: await this.bot.getEmoji(`790994076257353779`)}
        })
        await this.reply(this.locale.COMMAND.TITLE, {
            socket: {
                user: this.user.master.username,
                emoji: await this.bot.getEmoji(`692428927620087850`),
                command: `Profile`
            },
            image: (await new GUI(this.user, this.bot).build()).toBuffer(),
            prebuffer: true,
            simplified: true 
        })
        return fetching.delete()
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`profile`, `p`, `prof`],
	description: `Displaying user's profile card!`,
	usage: `profile <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}
