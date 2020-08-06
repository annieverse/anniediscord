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
    async execute({ reply, name, bot:{db} }) {
		await this.requestUserMetadata(1)
		console.log(this.commandName)
		//  Display tutorial if no input was given
		if (!this.fullArgs) return reply(this.locale.STRIKE.GUIDE)
		//  Returns if target is not a valid member.
		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})

		//  Fetching user's strike records
		const records = await db.getStrikeRecords(this.user.id, this.message.guild.id)
		if (!records.length) reply(this.locale.STRIKE.NULL_RECORD, {socket: {user: name(this.user.id), color: `golden`} })
		else reply(this.locale.STRIKE.DISPLAY_RECORD, {
			socket: {
				user: name(this.user.id),
				recordsLength: records.length, 
				reportedBy: name(records[0].reported_by),
				list: this.parseRecord(records)
			}
		})

		this.setSequence(3, 300000)
		this.sequence.on(`collect`, async msg => {
			let input = msg.content

			/**
			 * ---------------------
			 * Sequence Cancellations.
			 * ---------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			//	Remove quotation marks if accidentally included.
			if (input.includes(`"`)) input = input.split(`"`).join(``)
			//  Silently ghosting if user doesn't include the `add strike` prefix`
			if (!input.startsWith(`+`)) return

			let reason = input.substring(1).trim()+` `
			//	Fetch attachment's url as part of report
			if (msg.attachments.size > 0) {
				let imageLinks = []
				msg.attachments.forEach(element => {
					imageLinks.push(element.url)
				})
				reason += imageLinks.join(`\n`)
			}
			this.commandName == `complaint`? reason = `**complaint:** ${reason}` : reason = `**STRIKE:** ${reason}` 
			// Register new strike entry
			await db.registerStrike({ 
				user_id: this.user.id,
				reason: reason,
				reported_by: this.message.author.id,
				guild_id: this.message.guild.id
			})
			reply(this.locale.STRIKE.ENTRY_REGISTER, {socket: {user: name(this.user.id)}, color: `lightgreen`})
			return this.endSequence()
		})

	}

	/**
	 *  Display parsed result from available user's strike records.
	 *  @param {array} [records=[]] pulled strike entries from database
	 *  @returns {string}
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
	aliases: [`strike`,`strikes`, `strikez`,`complaint`],
	description: `Gives user a strike point.`,
	usage: `strike <User>`,
	group: `Moderation`,
	permissionLevel: 2,
	multiUser: true
}