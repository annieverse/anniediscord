/* eslint-disable no-unused-vars*/
/* eslint-disable no-useless-escape*/
const Command = require(`../../libs/commands`)
const cmd = require(`node-cmd`)

/**
 * 	Running terminal command
 * 	@author klerikdust
 */
class CommandLineInterface extends Command {

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
		await this.requestUserMetadata(1)

		//	Return if user doesn't specify arguments.
		if (!this.fullArgs) return reply(this.locale.CLI.GUIDE)
		//	Parse statement
		const stmt = this.fullArgs.match(/\[(.*?)\]/)[1]
		//	Make sure the the stmt is valid
		if (!stmt) return reply(this.locale.CLI.MISSING_STMT, {color: `red`})

		reply(this.locale.COMMAND.FETCHING, {
			simplified: true,
			socket: {
				emoji: await emoji(`790994076257353779`),
				command: `cli`,
				user: this.user.master.id
			} 
		})
		.then(load => {
			const initTime = process.hrtime()
			return cmd.get(stmt, (err, data) => {
				if (err) {
					load.delete()
					return reply(this.locale.ERROR, {socket: {error: err}, color: `red`})
				}
				const parsedResult = JSON.stringify(data).replace(/\\n/g, ` \n`)
				load.delete()
				return reply(this.locale.EXEC_CODE, {
					socket: {
						time: this.bot.getBenchmark(initTime),
						result: parsedResult.slice(0, 2000)
					}
				})
			})
		})
	}
}

module.exports.help = {
	start: CommandLineInterface,
	name: `cli`,
	aliases: [`cmd`, `cli`],
	description: `Running terminal command`,
	usage: `cli <[CommandStatement]> --flag`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: false,
}