/**
 * Main module
 * @Ping outputing bot ping
 */
 
class Ping {
	constructor(Stacks) {
		this.stacks = Stacks
	}
	async execute() {
		const { reply, code, ping } = this.stacks
		return reply(code.REQUEST_PING, {socket: [ping]})
	}
}


module.exports.help = {
	start: Ping,
	name: `ping`,
	aliases: [`pong`, `p1ng`, `poing`],
	description: `Gives bot's ping`,
	usage: `ping`,
	group: `Server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}