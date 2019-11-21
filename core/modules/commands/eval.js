/* eslint-disable no-unused-vars */
/**
 * Main module
 * @DeveloperTool as function to runs custom code on the fly
 */
const Discord = require(`discord.js`)
class DeveloperTool {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	/**
     * Initializer method
     * @Execute
     */
	async execute() {
		const {bot,palette, isDev, message, args, utils:{pages}, code: {EVAL}, reply} = this.stacks

		//  Returns if the author is not in dev team or admin.
		if (!isDev) return reply(EVAL.UNKNOWN_AUTHOR, { color: palette.red })

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
	aliases: [],
	description: `evalutes a line of code`,
	usage: `eval <what you want to test>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false,
}