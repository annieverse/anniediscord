const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Gives user a strike point.
 * @author klerikdust
 */
class Strike extends Command {

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
    async execute({ reply, collector, name, bot:{db, locale:{STRIKE}} }) {
		await this.requestUserMetadata(1)

		//  Display tutorial if no input was given
		if (!this.fullArgs) return reply(STRIKE.GUIDE)
		//  Returns if target is not a valid member.
		if (!this.user) return reply(STRIKE.INVALID_USER, {socket: [this.fullArgs], color: `red`})

		//  Fetching user's strike records
		const records = await db.getStrikeRecords(this.user.id)
		if (!records.length) reply(STRIKE.NULL_RECORD, {socket: [name(this.user.id), this.user.id]})
		else reply(STRIKE.DISPLAY_RECORD, {socket: [
			name(this.user.id),
			records.length, 
			name(records[0].reported_by),
			this.parseRecord(records)
		]})

		const sequence = collector(this.message)
		sequence.on(`collect`, async (msg) => {
			let input = msg.content
			sequence.stop()

			//	Remove quotation marks if accidentally included.
			if (input.includes(`"`)) input = input.split(`"`).join(``)

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
				
				// Register new strike entry
				await db.registerStrike({ 
					user_id: this.user.id,
					reason: reason,
					reported_by: this.message.author.id,
					guild_id: this.message.guild.id
				})
				sequence.stop()
				return reply(STRIKE.ENTRY_REGISTER, {socket: [name(this.user.id)], color: `lightgreen`})
			}
			sequence.stop()
		})

	}

	/**
	 *  Display parsed result from available user's strike records.
	 *  @param {Array} [records=[]] pulled strike entries from database
	 *  @returns {String}
	 */
	parseRecord(records=[]) {
		let str = ``
		for (let index in records) {
			str += `[${moment(records[index].registered_at).format(`MMMM Do YYYY, h:mm:ss a`)}](https://discord.gg/DCysMa6) - "${records[index].reason}"\n`
		}
		return str
	}

}

module.exports.help = {
	start: Strike,
	name: `strike`,
	aliases: [`strike`,`strikes`, `strikez`],
	description: `Gives user a strike point.`,
	usage: `strike <User>`,
	group: `Moderation`,
	multiUser: true
}