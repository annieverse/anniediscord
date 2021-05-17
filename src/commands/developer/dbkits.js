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
	async execute() {
		await this.requestUserMetadata(1)
		//	Return if user doesn't specify arguments.
		if (!this.fullArgs) return this.reply(this.locale.DBKITS.AUTHORIZED, {
            socket: {user: this.user.master.username}
        })
		try {

			//	Parse statement
			const stmt = this.fullArgs.match(/\[(.*?)\]/)[1]
			//	Make sure the the stmt is valid
			if (!stmt) return this.reply(this.locale.DBKITS.MISSING_STMT)
			//	Parse flag
			const flag = this.fullArgs.match(/[^--]*$/)[0].substring(0, 3)
			//	Flag check as well
			if (!flag) return this.reply(this.locale.DBKITS.MISSING_FLAG)

			const initTime = process.hrtime()
			const result = await this.bot.db._query(stmt, flag)
			const parsedResult = JSON.stringify(result).replace(/\,/g, `,\n`)
			return this.reply(this.locale.EXEC_CODE, {
				socket: {
					time: this.bot.getBenchmark(initTime),
					result: parsedResult.slice(0, 2000)
				}
			})
		}
		catch (e) {
			//	Catching failed query
			return this.reply(this.locale.ERROR, {socket: {error: e}, color: `red`})
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
