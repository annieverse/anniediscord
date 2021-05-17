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
     * @return {void}
     */
	async execute() {
        await this.requestUserMetadata(2)
        await this.requestAuthorMetadata(2)
        //  Handle if user doesn't exists
        if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
        //  Handle if user doesn't have any relationships
        if (!this.user.relationships.length) return this.reply(this.locale.RELATIONSHIP.IS_EMPTY, {
            socket: {prefix: this.bot.prefix}
        })
        const fetching = await this.reply(this.locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                command: `relationship`,
                emoji: await this.bot.getEmoji(`790994076257353779`),
                user: this.user.master.id
            }
        })
        await this.reply(this.locale.COMMAND.TITLE, {
            simplified: true,
            prebuffer: true,
            socket: {
                command: `Relationship`,
                emoji: await this.bot.getEmoji(`692429004417794058`),
                user: this.user.master.username
            },
            image: await new GUI(this.user, this.bot, this.author).build()
        })
        return fetching.delete()
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
