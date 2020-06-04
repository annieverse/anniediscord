const Command = require(`../../libs/commands`)
/**
 * checks if a user is blocked from using modmail
 * @author The Frying Pan
 */
class Blocked extends Command {

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
    async execute({reply}) {
        
        await this.requestUserMetadata(1)

        const requestedUserIsMessageAuthor = this.user.id == this.message.author.id
        
        if (requestedUserIsMessageAuthor) return reply(`You must supply a user id, tag, or name, you can not look up yourself`)
        let request = this.bot.db.isblockedUser(this.user.id)

        if (!request) return reply(`${this.user.user.username} is not blocked.`)
        return reply(`${this.user.user.username} is blocked.`)

    }
}


module.exports.help = {
    start: Blocked,
    name: `isblocked`,
    aliases: [],
    description: `checks if a user is blocked from sending messages to annie`,
    usage: `isblocked @user`,
    group: `modmail`,
    permissionLevel: 2,
    public: true,
    multiUser: true
}