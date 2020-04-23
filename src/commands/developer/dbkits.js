/* eslint-disable no-useless-escape */
const Command = require(`../../libs/commands`)
/**
 * 	Running database queries on air
 * 	@author klerikdust
 */
class DatabaseKits extends Command {

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
	async execute({ reply, palette, name, bot:{db} }) {
		await this.requestUserMetadata(1)

		//	Return if user doesn't specify arguments.
		if (!this.fullArgs) return reply(this.locale.DBKITS.AUTHORIZED, {socket: {user: name(this.user.id)}, color: `crimson`})

		try {

			//	Parse statement
			const stmt = this.fullArgs.match(/\[(.*?)\]/)[1]
			//	Make sure the the stmt is valid
			if (!stmt) return reply(this.locale.DBKITS.MISSING_STMT)

			//	Parse flag
			const flag = this.fullArgs.match(/[^--]*$/)[0].substring(0, 3)
			//	Flag check as well
			if (!flag) return reply(this.locale.DBKITS.MISSING_FLAG)

			//	Running query
			const result = await db._query(stmt, flag)
			//	Prettify result for readability
			const parsedResult = JSON.stringify(result).replace(/\,/g, `,\n`)
			//	Display result
			return reply(`\`\`\`json\n${parsedResult}\n\`\`\``)

		}
		catch (e) {
			//	Catching failed query
			return reply (this.locale.ERROR, {socket: {error: e}, color: `red`})
		}
	}
}

module.exports.help = {
	start: DatabaseKits,
	name: `dbkits`,
	aliases: [`db`],
	description: `Running database queries on air`,
	usage: `db <[SqlStatement]> --flag`,
	group: `Developer`,
	permissionLevel: 4,
	multiUser: false
}