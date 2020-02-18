const moment = require(`moment`)

/**
 *  Main Module
 *  Complaint System. A subset/safer model from strike command.
 */
class Complaint {
	constructor(Stacks) {
		this.stacks = Stacks
		this.db = Stacks.bot.db
		this.targetUser = Stacks.meta.author
		this.reporter = Stacks.message.author
		this.logger = Stacks.bot.logger
	}


	async execute() {
		const { isModerator, fullArgs, collector, reply, code } = this.stacks

		//  Returns when the user authority level doesn't meet the minimum requirement
		if (!isModerator) return reply(code.COMPLAINT.UNAUTHORIZED)
		//  Display tutorial if no input was given
		if (!fullArgs) return reply(code.COMPLAINT.GUIDE)
		//  Returns if target is not a valid member.
		if (!this.targetUser) return reply(code.COMPLAINT.INVALID_USER, {socket: [fullArgs]})
		
		const records = await this.view()

		if (!records) reply(code.COMPLAINT.NULL_RECORD)
		else reply(code.COMPLAINT.DISPLAY_RECORD, {socket: [
			this.targetUser.id,
			records.length, 
			records[0].assigned_by,
			this.parseRecord(records)
		]})

	
		collector.on(`collect`, async (msg) => {
			let input = msg.content

			//	Remove quotation marks if accidentaly included to avoid errors.
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

				this.register(reason)
				reply(code.COMPLAINT.ENTRY_REGISTER, {color: `okay`, socket: [this.reporter.username, this.targetUser.id]})
				collector.stop()
			}

			// Remove one entry from target user's complaint records
			if (input.startsWith(`-`)) {
				this.unregister()
				reply(code.COMPLAINT.ENTRY_DELETED, {color: `okay`, socket: [this.reporter.username, this.targetUser.id]})
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
		this.logger.debug(`viewing ${this.targetUser.id} complaint records`)
		return this.db._query(`
			SELECT *
			FROM strike_list
			WHERE userId = ?
			AND strike_type = "complaint"
			ORDER BY timestamp
			DESC`
			, `all`
			, [this.targetUser.id]
		)
	}

	_register(reason=``) {
		this.logger.info(`New complaint entry for ${this.targetUser.id} has been added by ${this.reporter.username}`)
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

	_unregister() {
		this.logger.info(`Recent complaint entry for ${this.targetUser.id} has been removed by ${this.reporter.username}`)
		return this.db._query(`
			DELETE FROM strike_list
			WHERE _rowid_ = (SELECT MAX(_rowid_) FROM strike_list)
			AND userId = ?,
			AND strike_type = "complaint"`
			, `run`
			, [this.targetUser.id]
		)
	}
}

module.exports.help = {
	start: Complaint,
	name: `complaint`,
	aliases: [`complaint`,`complaints`, `complaintz`],
	description: `Give a complaint to a user`,
	usage: `complaint @user`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: true,
	special_channels: [`603287083846729728`, `622038747290009620`,`639148941362987008`]
}