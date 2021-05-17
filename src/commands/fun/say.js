const Command = require(`../../libs/commands`)
/**
 * Talk through bot.
 * @author klerikdust
 */
class Say extends Command {

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
		if (!this.fullArgs) return this.reply(this.locale.SAY.SHORT_GUIDE, {
            socket: {
                emoji: await this.bot.getEmoji(`AnnieNyaa`)
            }
        })
		this.message.delete()
		return this.reply(this.fullArgs, {color: `crimson`})
	}
}

module.exports.help = {
	start: Say,
	name: `say`,
	aliases: [],
	description: `Talk through Annie!`,
	usage: `say <Message>`,
	group: `Fun`,
	permissionLevel: 3
}
