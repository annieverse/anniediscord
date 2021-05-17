const Command = require(`../../libs/commands`)
const random = require(`../../utils/random`)
/**
 * I'll try to pick any options you give!
 * @author klerikdust
 */
class Choose extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		await this.requestUserMetadata(1)
		//  Returns if no question was specified.
		if (!this.fullArgs) return this.reply(this.locale.CHOOSE.GUIDE)
		//  Handle if Annie can't parse options from user's input.
		if (!this.tokenizedOptions) return this.reply(this.locale.CHOOSE.INVALID_OPTIONS, {color: `red`})
		return this.reply(`${random(this.locale.CHOOSE.THINKING)} **${random(this.tokenizedOptions)}!** ${await this.bot.getEmoji(random(this.locale.CHOOSE.EMOTIONS))}`)
	}

	/**
	 * Parse and tokenize user's options
	 * @type {?string}
	 */
	get tokenizedOptions() {
		const source = this.fullArgs.toLowerCase()
		let str = ``
		str = source.replace(`?`, ``)
		if (source.includes(`,`)) {
			if(source.includes(`or`)) str = source.replace(`or`, ``)
			return str.split(`,`)
		}
		if (source.includes(`or`)) return source.split(`or`)
		return null
	}
}


module.exports.help = {
	start: Choose,
	name: `choose`,
	aliases: [`choose`, `pick`],
	description: `I'll try to pick any options you give!`,
	usage: `choose <options>`,
	group: `Fun`,
	permissionLevel: 0,
	multiUser: false
}
