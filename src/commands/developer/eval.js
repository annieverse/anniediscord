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
		const initTime = process.hrtime()
		try {
			let evaled = await eval(this.args.join(` `))
			if (typeof evaled !== `string`) evaled = require(`util`).inspect(evaled)
			return reply(this.locale.EXEC_CODE, {
				socket: {
					time: this.bot.getBenchmark(initTime),
					result: evaled.slice(0, 2000)
				}
			})
		} 
		catch (err) {
			return reply(this.locale.ERROR, {socket: {error: err}, color: `red`})
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
	permissionLevel: 4,
	multiUser: false,
}