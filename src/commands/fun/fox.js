const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random picture of a fox.
 * @author klerikdust
 */
class Fox extends Command {

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
    async execute({ reply, choice }) {
        const { body } = await superagent.get(`https://some-random-api.ml/img/fox`)
        return reply(choice(this.locale.FOX.RESPONSES), {
            image: body.link,
            prebuffer: true,
        })
	}

}

module.exports.help = {
	start: Fox,
	name: `fox`,
	aliases: [],
	description: `Displays a random picture of a fox.`,
	usage: `fox`,
	group: `Fun`,
	permissionLevel: 0,
	multiUser: false
}