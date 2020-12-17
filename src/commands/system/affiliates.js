const Command = require(`../../libs/commands`)
/**
 * List of servers that supporting the development of Annie.
 * @author klerikdust
 */
class Affiliates extends Command {
	constructor(Stacks) {
		super(Stacks)
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, name }) {
		await this.requestUserMetadata(1)
		const affiliateList = await this.bot.db.getAffiliates()
		//  Handle if there are no registered affiliates
		if (!affiliateList.length) return reply(this.locale.AFFILIATES.EMPTY, {status: `warn`})
		//  Limits functionality for non-developer
		if (!this.fullArgs || (this.message.author.permissions.level < 4)) return reply(this.locale.AFFILIATES.DISPLAY, {
			header: `Annie's Affiliated Servers`,
			thumbnail: this.bot.user.displayAvatarURL(),
			socket: {
				list: this._prettifyList(affiliateList, ...arguments),
				user: name(this.user.id)
			},
			color: `crimson`
		})
	}

    /**
     * Parse & prettify elements from given source.
     * @param {array} [source=[]] refer to guild configuration structure
     * @returns {string}
     */
    _prettifyList(source=[]) {
        let res = ``
        for (let i=0; i<source.length; i++) {
            if (i <= 0) res += `\n╭───────────────────╮\n\n`
            let server = source[i]
            res += `**• ${this.bot.guilds.cache.get(server.guild_id)}**\n"*${server.description}*"\n[Click here to join!](${server.invite_link})\n\n`
            if (i === (source.length-1)) res += `╰───────────────────╯\n`
        }
        return res
    }
}


module.exports.help = {
	start: Affiliates,
	name: `affiliates`,
	aliases: [`affiliate`, `affiliates`, `affil`],
	description: `List of servers that supporting the development of Annie.`,
	usage: `affiliate`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}