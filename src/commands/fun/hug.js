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
    async execute({ reply, bot:{locale:{HUG}} }) {
        await this.requestUserMetadata(1)
        const { body } = await superagent.get(`https://some-random-api.ml/animu/hug`)

        //  Lonely hug
        if (!this.fullArgs) return reply(HUG.THEMSELVES, {
            socket: [this.user],
            image: body.link,
            prebuffer: true,
        })

        //  Hugging other user
        return reply(HUG.OTHER_USER, {
            socket: [this.user, this.fullArgs],
            image: body.link,
            prebuffer: true,
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
    multiUser: false
}