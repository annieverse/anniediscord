const Command = require(`../../libs/commands`)
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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, choice, emoji }) {
		await this.requestUserMetadata(1)

		//  Returns if no question was specified.
		if (!this.fullArgs) return reply(this.locale.CHOOSE.GUIDE)
		//  Handle if Annie can't parse options from user's input.
		if (!this.tokenizedOptions) return reply(this.locale.CHOOSE.INVALID_OPTIONS, {color: `red`})
		
		const result = choice(this.tokenizedOptions)
		return reply(`${choice(this.locale.CHOOSE.THINKING)} **${result}!** ${emoji(choice(this.locale.CHOOSE.EMOTIONS))}`)
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
	usage: `choose <OptionsToPick>`,
	group: `Fun`,
	permissionLevel: 0,
	multiUser: false
}