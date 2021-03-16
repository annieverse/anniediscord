const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random gif of a pat.
 * @author klerikdust
 */
class Pat extends Command {

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
    async execute({ reply, emoji }) {
        await this.requestUserMetadata(2)
        await this.requestAuthorMetadata(2)
        const { body } = await superagent.get(`https://purrbot.site/api/img/sfw/pat/gif`)
        //  Lonely pat
        if (!this.user || !this.fullArgs) return reply(this.locale.PAT.THEMSELVES, {
            socket: {
                user: this.author.username,
                emoji: emoji(`AnnieCry`)
            },
            imageGif: body.link
        })
        //  Patting other user
        return reply(this.locale.PAT.OTHER_USER, {
            socket: {user: this.author.master.username, targetUser: this.user.master.username},
            imageGif: body.link
        })
    }
}

module.exports.help = {
    start: Pat,
    name: `pat`,
    aliases: [],
    description: `Displays a random gif of a pat.`,
    usage: `pat <User>(Optional)`,
    group: `Fun`,
    permissionLevel: 0,
    multiUser: true
}