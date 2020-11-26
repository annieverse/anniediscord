const GUI = require(`../../ui/prebuild/profile`)
const Command = require(`../../libs/commands`)
/**
 * Displays your profile card, including timeline, badges, relationship, and statistics
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
    async execute({ reply, emoji, name, avatar }) {
        await this.requestUserMetadata(2)

        //  Handle if user doesn't exists
        if (!this.user) return reply(this.locale.USER.IS_INVALID)
        this.fetching = await reply(this.locale.COMMAND.FETCHING, {
            socket: {
                emoji: emoji(`AAUloading`),
                command: `profile`,
                user: this.user.id
            },
            simplified: true
        })
        await reply(this.locale.COMMAND.TITLE, {
            socket: {
                user: name(this.user.id),
                emoji: emoji(`AnnieSmile`),
                command: `Profile`
            },
            image: (await new GUI(this.user,this.bot, {}, avatar).build()).toBuffer(),
            prebuffer: true,
            simplified: true 
        })
        return this.fetching.delete()
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`profile`, `p`, `timeline`, `portfolio`, `badges`, `badge`, `family`, `friend`, `friends`],
	description: `Displays your profile card, including timeline, badges, relationship, and statistics`,
	usage: `profile <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}