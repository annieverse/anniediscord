const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random gif of a hug.
 * @author klerikdust
 */
class Hug extends Command {

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
        await this.requestUserMetadata(2)
        await this.requestAuthorMetadata(2)
        const { body } = await superagent.get(`https://purrbot.site/api/img/sfw/hug/gif`)
        //  Lonely hug
        if (!this.user || !this.fullArgs) return reply(this.locale.HUG.THEMSELVES, {
            socket: {user: name(this.author.id)},
            imageGif: body.link,
        })
        //  Hugging other user
        return reply(this.locale.HUG.OTHER_USER, {
            socket: {user: name(this.author.master.id), targetUser: name(this.user.master.id)},
            imageGif: body.link
        })
    }
}

module.exports.help = {
    start: Hug,
    name: `hug`,
    aliases: [`hugs`, `hug`],
    description: `Displays a random gif of a hug.`,
    usage: `hug <User>(Optional)`,
    group: `Fun`,
    permissionLevel: 0,
    multiUser: true
}