const Pistachio = require(`../../libs/pistachio`)
/**
 * Main module
 * @Ping outputing bot ping
 */
 
class Ping extends Pistachio {
	constructor(Stacks) {
		super(Stacks)
	}
	async execute() {
		return super.reply(1)
		return super.reply(super.bot.locales.REQUEST_PING, {
			color: super.utils.palette.lightgreen,
			socket: [super.utils.commanifier(Math.round(super.bot.ping))]
		})
	}
}


module.exports.help = {
	start: Ping,
	name: `ping`,
	aliases: [`pong`, `p1ng`, `poing`],
	description: `Gives bot's ping`,
	usage: `ping`,
	group: `Server`,
	permissionLevel: 0,
	public: true,
	required_usermetadata: false,
	multiUser: false
}