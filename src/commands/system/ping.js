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
	async execute({ reply, commanifier }) {
		await this.requestUserMetadata(2)
		return reply(this.locale.REQUEST_PING, {
			socket: {ping: commanifier(Math.round(this.bot.ping))}
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