/* eslint-disable no-unused-vars*/
/* eslint-disable no-useless-escape*/
const Command = require(`../../libs/commands`)
const Discord = require(`discord.js`)
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
	async execute({ reply, bot:{locale:{DBKITS}}, palette }) {

		//	Return if user doesn't specify arguments.
		if (!this.fullArgs) return reply(`please include the cmd`)

		//	Parse statement
		const stmt = this.fullArgs.match(/\[(.*?)\]/)[1]
		//	Make sure the the stmt is valid
		if (!stmt) return reply(DBKITS.MISSING_STMT)

		
		//	Parse flag
		const flag = this.fullArgs.match(/[^--]*$/)[0].substring(0, 3)
		//	Flag check as well
		if (!flag) return reply(DBKITS.MISSING_FLAG)


		reply(`\`executing "${flag}" method ...\``, {simplified: true})
			.then(load => {
				//	Running query
				if (flag === `run`) {
					cmd.run(stmt)
					load.delete()
					return reply(`executed.`, {color:palette.lightgreen})
				}

				return cmd.get(stmt, function(err, data) {
					//	Catch error.
					if (err) {
						load.delete()
						return reply(err, {color:palette.red})
					}

					const parsedResult = JSON.stringify(data).replace(/\\n/g, ` \n`)
					//	Display result.
					load.delete()
					return reply(`\`\`\`json\n${parsedResult}\n\`\`\``)
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
	permissionLevel: `4`,
	public: true,
	multiUser: false,
}