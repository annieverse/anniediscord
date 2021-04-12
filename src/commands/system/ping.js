const Command = require(`../../libs/commands`)
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
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, commanifier, emoji }) {
		return reply(this.locale.REQUEST_PING, {
			status: `success`,
			socket: {
				ping: commanifier(Math.floor(this.bot.ws.ping)),
				emoji: await emoji(`789212493096026143`)
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