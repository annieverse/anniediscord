const moment = require(`moment`)
const Action = require(`../../libs/moderations`)

/**
 *  Main Module
 *  Strike System. A general moderation system to automate mute/kick/ban a user.
 */
class Strike {
	constructor(Stacks) {
		this.stacks = Stacks
		this.db = Stacks.bot.db
		this.targetUser = Stacks.meta.author
		this.reporter = Stacks.message.author
		this.logger = Stacks.bot.logger
	}


	async execute() {
		const { isAdmin, fullArgs, collector, reply, code, message } = this.stacks

		//  Returns when the user authority level doesn't meet the minimum requirement
		if (!isAdmin) return reply(code.STRIKE.UNAUTHORIZED)
		//  Display tutorial if no input was given
		if (!fullArgs) return reply(code.STRIKE.GUIDE)
		//  Returns if target is not a valid member.
		if (!this.targetUser) return reply(code.STRIKE.INVALID_USER, {socket: [fullArgs]})
		
		const records = await this.view()

		if (!records) reply(code.STRIKE.NULL_RECORD)
		else reply(code.STRIKE.DISPLAY_RECORD, {socket: [
			this.targetUser.id,
			records.length, 
			records[0].assigned_by,
			this.parseRecord(records)
		]})

	
		collector.on(`collect`, async (msg) => {
			let input = msg.content
			let recordSize = records > 4 ? 4 : records

			//	Remove quotation marks if accidentally included.
			if (input.includes(`"`)) input = input.split(`"`).join(``)

			//  Register new complaint record
			if (input.startsWith(`+`)) {
				let reason = input.substring(1).trim()+` `

				//	Fetch attachment's url as part of report
				if (msg.attachments.size > 0) {
					let imageLinks = []
					msg.attachments.forEach(element => {
						imageLinks.push(element.url)
					})
					reason += imageLinks.join(`\n`)
				}
				
				// Register strike report and apply action to the user based on points being held
				this.register(reason)
				new Action(message, this.targetUser.id).byPoints(records.length)
				reply(code.STRIKE[`${recordSize}_STRIKE`], {color: `okay`})
				collector.stop()
			}
			collector.stop()
		})

	}


	/**
	 *  Display parsed result from available user's complaint record.
	 *  @param {Array} records pulled complaint entries from database
	 */
	async parseRecord(records=[]) {
		let str = ``
		for (let index of records) {
			str += `\n[${moment(records[index].timestamp).format(`MMMM Do YYYY, h:mm:ss a`)}](complaints) - ${records[index].assigned_by} "${records[index].reason}"`
		}
		return str
	}
	

	_view() {
		this.logger.debug(`viewing ${this.targetUser.id} strike records`)
		return this.db._query(`
			SELECT *
			FROM strike_list
			WHERE userId = ?
			AND strike_type = "strike"
			ORDER BY timestamp
			DESC`
			, `all`
			, [this.targetUser.id]
		)
	}

	_register(reason=``) {
		this.logger.info(`New strike entry for ${this.targetUser.id} has been added by ${this.reporter.username}`)
		return this.db._query(`
			INSERT INTO strike_list(
				timestamp,
				assigned_by,
				userId,
				reason
			)
			VALUES(datetime('now'), ?, ?, ?)`
			, `all`
			, [this.reporter.id, this.targetUser.id, reason]
		)
	}

}

module.exports.help = {
	start: Strike,
	name: `strike`,
	aliases: [`strike`,`strikes`, `strikez`],
	description: `Give a strike point to a user`,
	usage: `strike @user`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true,
	special_channels: [`603287083846729728`, `622038747290009620`,`639148941362987008`]
}