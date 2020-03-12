/**
 * Main module
 * @Ping outputing bot ping
 */
 
class Ping {
	constructor(Stacks) {
		this.stacks = Stacks
		this.reply = Stacks.reply
	}
	async execute() {
		const { bot, commanifier, palette } = this.stacks
		return this.reply(bot.locale.REQUEST_PING, {
			color: palette.lightgreen,
			socket: [commanifier(Math.round(bot.ping))]
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
	multi_user: false
}