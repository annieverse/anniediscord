const Command = require(`../../libs/commands`)
const random = require(`../../utils/random`)
/**
 * I'll try to pick any options you give!
 * @author klerikdust
 */
module.exports = {
	name: `choose`,
	aliases: [`choose`, `pick`],
	description: `I'll try to pick any options you give!`,
	usage: `choose <options>`,
	permissionLevel: 0,
	multiUser: false,
	async execute(client, reply, message, arg, locale) {
		if (!arg) return reply.send(locale.CHOOSE.GUIDE)
		//  Handle if Annie can't parse options from user's input.
		const opts = this._tokenizedOptions(arg)
		if (!opts) return reply.send(locale.CHOOSE.INVALID_OPTIONS)
		return reply.send(`${random(locale.CHOOSE.THINKING)} **${random(opts)}!** ${await client.getEmoji(random(locale.CHOOSE.EMOTIONS))}`)
	},

	/**
	 * Parse and tokenize user's options
	 * @param {string} src Target arg.
	 * @return {string|null{
	 */
	_tokenizedOptions(src) {
		const source = src.toLowerCase()
		let str = ``
		str = source.replace(`?`, ``)
		if (source.includes(`,`)) {
			if (source.includes(`or`)) str = source.replace(`or`, `,`)
			return str.split(`,`)
		}
		if (source.includes(`or`)) return source.split(`or`)
		return null
	}
}