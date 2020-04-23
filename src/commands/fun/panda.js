const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random image of a panda.
 * @author klerikdust
 */
class Panda extends Command {

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
    async execute({ reply, choice, bot:{locale:{PANDA}} }) {
        const { body } = await superagent.get(`https://some-random-api.ml/img/panda`)
        return reply(choice(PANDA.RESPONSES), {
            image: body.link,
            prebuffer: true,
        })
    }

}

module.exports.help = {
    start: Panda,
    name: `panda`,
    aliases: [],
    description: `Displays a random image of a panda.`,
    usage: `panda`,
    group: `Fun`,
    permissionLevel: 0,
    multiUser: false
}