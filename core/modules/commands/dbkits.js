/* eslint-disable no-useless-escape */

/**
 * 	Running query on air
 * 	@DatabaseKits
 */
class DatabaseKits {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
	 * 	Execute task
	 * 	@execute
	 */
	async execute() {
		const { isDev, bot: {db}, fullArgs, reply, palette, code:{ DBKITS }, name, meta: {author} } = this.stacks


		//	Return if user is not part of the developer team
		if (!isDev) return reply(DBKITS.UNAUTHORIZED, {color: palette.red})

		//	Return if user doesn't specify arguments.
		if (!fullArgs) return reply(DBKITS.AUTHORIZED, {socket: [name(author.id)], color: palette.blue})


		try {

			//	Parse statement
			const stmt = fullArgs.match(/\[(.*?)\]/)[1]
			//	Make sure the the stmt is valid
			if (!stmt) return reply(DBKITS.MISSING_STMT)

			
			//	Parse flag
			const flag = fullArgs.match(/[^--]*$/)[0].substring(0, 3)
			//	Flag check as well
			if (!flag) return reply(DBKITS.MISSING_FLAG)


			//	Running query
			const result = await db._query(stmt, flag)
			//	Prettify result for readability
			const parsedResult = JSON.stringify(result).replace(/\,/g, `,\n`)

			//	Display result
			return reply(`\`\`\`json\n${parsedResult}\n\`\`\``)

		}
		catch (e) {
			//	Catching failed query
			return reply (DBKITS.ERROR + e.message)
		}
	}
}

module.exports.help = {
	start: DatabaseKits,
	name: `dbkits`,
	aliases: [`db`],
	description: `Allows to do sql queries`,
	usage: `db <subcommand>`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}