const GUI = require(`../../ui/prebuild/post`)
const Command = require(`../../libs/commands`)
/**
 * Displays your recently posted art.
 * @author klerikdust
 */
class Post extends Command {

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
        if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
        //  Handle if user doesn't have any posted art
        if (!this.user.posts.length) return reply(this.locale.POST.IS_EMPTY, {color: `red`, socket: {user: name(this.user.id), emoji: emoji(`AnnieCry`)} })
        this.user.recentPostLocalTimestamp = await this.bot.db.toLocaltime(this.user.posts[0].registered_at)
        this.fetching = await reply(this.locale.COMMAND.FETCHING, {
            socket: {
                emoji: emoji(`AAUloading`),
                command: `recent post`,
                user: this.user.id
            },
            simplified: true
        })
        await reply(this.locale.COMMAND.TITLE, {
            socket: {
                user: name(this.user.id),
                emoji: emoji(`AnniePogg`),
                command: `Recent Post`
            },
            image: (await new GUI(this.user).build()).toBuffer(),
            prebuffer: true,
            simplified: true 
        })
        return this.fetching.delete()
	}
}

module.exports.help = {
	start: Post,
	name: `post`,
	aliases: [`portfolio`, `post`, `posts`, `recentpost`, `recentlyposted`, `recentlypost`, `artwork`],
	description: `Displays your recently posted art.`,
	usage: `post <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true,
    invisible: true
}