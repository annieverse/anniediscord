/* eslint-disable no-unused-vars*/
/* eslint-disable no-useless-escape*/
const Command = require(`../../libs/commands`)
/**
 * 	Evaluate line of code on air
 * 	@author klerikdust
 */
class DeveloperTool extends Command {

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
	async execute({ reply }) {
		try {
			let evaled = await eval(this.args.join(` `))
			if (typeof evaled !== `string`) evaled = require(`util`).inspect(evaled)
			return reply(evaled)

		} catch (err) {
			return reply(message)
		}
	}
}

module.exports.help = {
	start: DeveloperTool,
	name: `eval`,
	aliases: [`ev`, `evl`, `exec`],
	description: `Evaluate line of code on air`,
	usage: `eval <LineOfCode>`,
	group: `Developer`,
	permissionLevel: `4`,
	public: true,
	multiUser: false,
}