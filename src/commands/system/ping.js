const Command = require(`../../libs/commands`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Output bot's latency
 * @author klerikdust
 */
class Ping extends Command {
	constructor(Stacks) {
		super(Stacks)
	}

	/**
	 * Running command workflow
	 * @return {void}
	 */
	async execute() {
		return this.reply(this.locale.REQUEST_PING, {
			status: `success`,
			socket: {
				ping: commanifier(Math.floor(this.bot.ws.ping)),
				emoji: await this.bot.getEmoji(`789212493096026143`)
			}
		})
	}
}


module.exports.help = {
	start: Ping,
	name: `ping`,
	aliases: [`pong`, `p1ng`, `poing`],
	description: `Output bot's latency`,
	usage: `ping`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}
