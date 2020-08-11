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
    async execute({ reply, name }) {
        await this.requestUserMetadata(1)
        const { body } = await superagent.get(`https://some-random-api.ml/animu/pat`)

        //  Lonely pat
        if (!this.fullArgs) return reply(this.locale.PAT.THEMSELVES, {
            socket: {user: name(this.user.id)},
            image: body.link,
            prebuffer: true,
        })

        //  Patting other user
        return reply(this.locale.PAT.OTHER_USER, {
            socket: {user: name(this.user.id), targetUser: this.fullArgs},
            image: body.link,
            prebuffer: true,
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