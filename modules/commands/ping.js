/**
 * Main module
 * @Ping outputing bot ping
 * Revised: 06/07/19 - Fwubbles.
 */
 
class Ping {
	async execute(Stacks) {
		Stacks.message.delete()
		return Stacks.utils.advSend('RANDOM', `${Stacks.message.author} requested \`${Stacks.message.content}\`\n- Request taken in **${Math.round(Stacks.bot.ping)}ms**`, 'Ping', Date.now(), `| AAU Ping Command,, ${Stacks.bot.user.displayAvatarURL}`)
	}
}


module.exports.help = {
	start: Ping,
	name: "ping",
	aliases: ["pong", "p1ng", "poing"],
	description: `Gives bot's ping`,
	usage: `${require(`../../.data/environment.json`).prefix}ping`,
	group: "Server",
	public: true,
	require_usermetadata: false,
	multi_user: false
}