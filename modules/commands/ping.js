/**
 * Main module
 * @Ping outputing bot ping
 */
 
class Ping {
	constructor(Stacks) {
		this.stacks = Stacks;
	}
	async execute() {
		const { reply, code, ping } = this.stacks.pistachio;
		return reply(code.REQUEST_PING, {socket: [ping]})
	}
}


module.exports.help = {
	start: Ping,
	name: "ping",
	aliases: ["pong", "p1ng", "poing"],
	description: `Gives bot's ping`,
	usage: `>`,
	group: "Server",
	public: true,
	require_usermetadata: false,
	multi_user: false
}