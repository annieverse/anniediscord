const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random picture of a cat.
 * @author klerikdust
 */
class Cat extends Command {

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
    async execute({ reply, choice, bot:{locale:{CAT}} }) {
        const { body } = await superagent.get(`https://some-random-api.ml/img/cat`)
        return reply(choice(CAT.RESPONSES), {
            image: body.link,
            prebuffer: true,
        })
    }
}

module.exports.help = {
    start: Cat,
    name: `cat`,
    aliases: [`kitty`, `cat`],
    description: `Displays a random picture of a cat.`,
    usage: `cat`,
    group: `Fun`,
    permissionLevel: 0,
    public: true,
    multiUser: false
}