const GUI = require(`../../ui/prebuild/profile`)
const Command = require(`../../libs/commands`)
/**
 * Displaying your personalized card!
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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name }) {
        await this.requestUserMetadata(2)
        //  Handle if user doesn't exists
        if (!this.user) return reply(this.locale.USER.IS_INVALID)
        this.fetching = await reply(this.locale.PROFILECARD.FETCHING, {
            socket: {emoji: await emoji(`790994076257353779`)}
        })
        await reply(this.locale.COMMAND.TITLE, {
            socket: {
                user: name(this.user.master.id),
                emoji: await emoji(`692428927620087850`),
                command: `Profile`
            },
            image: (await new GUI(this.user, this.bot).build()).toBuffer(),
            prebuffer: true,
            simplified: true 
        })
        return this.fetching.delete()
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`profile`, `p`, `prof`],
	description: `Displaying your personalized card!`,
	usage: `profile <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}