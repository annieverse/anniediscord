/**
 * Main module
 * @Ping outputing bot ping
 * Revised: 06/07/19 - Fwubbles.
 */
 
class Ping {
	async execute(Stacks) {
		Stacks.message.delete()
		//return Stacks.utils.send(`${Stacks.message.author} requested \`${Stacks.message.content}\`\n- Request taken in **${Math.round(Stacks.bot.ping)}ms**`)
		return Stacks.utils.advSend('#0099ff','TEST','','','','TEST2')
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
}