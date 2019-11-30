/* eslint-disable no-unused-vars*/
/* eslint-disable no-useless-escape*/
/**
 * Main module
 * @DeveloperTool as function to runs custom code on the fly
 */
const Discord = require(`discord.js`)
const cmd = require(`node-cmd`)
class DeveloperTool {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     * CLI tool. Took boilerplate from dbkits.js
     * @commandLineInterface
     */
	async commandLineInterface() {
		const { fullArgs, reply, palette, code:{ DBKITS }, name, meta: {author} } = this.stacks

		//	Return if user doesn't specify arguments.
		if (!fullArgs) return reply(`please include the cmd`)

		//	Parse statement
		const stmt = fullArgs.match(/\[(.*?)\]/)[1]
		//	Make sure the the stmt is valid
		if (!stmt) return reply(DBKITS.MISSING_STMT)

		
		//	Parse flag
		const flag = fullArgs.match(/[^--]*$/)[0].substring(0, 3)
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

				return cmd.get(stmt, function(err, data, stderr) {
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


	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const {bot, palette, isDev, command, message, args, utils:{pages}, code: {EVAL}, reply} = this.stacks

		//  Returns if the author is not in dev team or admin.
		if (!isDev) return reply(EVAL.UNKNOWN_AUTHOR, { color: palette.red })

		//	Run CLI when "cmd" prefix is used.
		if (command.startsWith(`cmd`)) return this.commandLineInterface()

		try {
			let evaled = await eval(args.join(` `))
			if (typeof evaled !== `string`) evaled = require(`util`).inspect(evaled)
			return pages(message, evaled)

		} catch (err) {
			return pages(message, err.stack)
		}
	}
}

module.exports.help = {
	start: DeveloperTool,
	name: `eval`,
	aliases: [`cmd`],
	description: `evalutes a line of code`,
	usage: `eval <what you want to test>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false,
}