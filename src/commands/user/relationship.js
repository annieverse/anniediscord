const Command = require(`../../libs/commands`)
const GUI = require((`../../ui/prebuild/relationship`))
/**
 * Display user's relationship trees
 * @author klerikdust
 */
class Relationship extends Command {

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
        await this.requestAuthorMetadata(2)
        //  Handle if user doesn't exists
        if (!this.user) return reply(this.locale.USER.IS_INVALID)
        //  Handle if user doesn't have any relationships
        if (!this.user.relationships.length) return reply(this.locale.RELATIONSHIP.IS_EMPTY, {
            socket: {prefix: this.bot.prefix}
        })
        this.fetching = await reply(this.locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                command: `relationship`,
                emoji: emoji(`AAUloading`),
                user: this.user.id
            }
        })
        await reply(this.locale.COMMAND.TITLE, {
            simplified: true,
            prebuffer: true,
            socket: {
                command: `Relationship`,
                emoji: emoji(`AnnieWink`),
                user: name(this.user.id)
            },
            image: await new GUI(this.user, name, avatar, this.bot, this.author).build()
        })
        return this.fetching.delete()
    }
}

module.exports.help = {
    start: Relationship,
    name: `relationship`,
    aliases: [`rel`, `rtship`, `relation`, `relations`, `relationship`],
    description: `Display user's relationship trees`,
    usage: `relationship <user>(Optional)`,
    group: `User`,
    permissionLevel: 0,
    multiUser: true
}