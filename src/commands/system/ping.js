const Command = require(`../../libs/commands`)
/**
 * Outut bot ping
 * @since 6.0.0
 * @author klerikdust
 */
class Ping extends Command {
	constructor(Stacks) {
		super(Stacks)
	}

	/**
	 * Running command workflow
	 * @since 6.0.0
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, commanifier, bot:{locale, ping} }) {

		/**
		 * This method is used to fetch user data.
		 * Set the parameter to 1 for first-block data level (only returning user object)
		 * or set to 2 for second-block data level to get the complete user's metadata (inventories, exp, etc)
		 * 
		 * Later you can access the data through `this.user` 
		 */
		await this.requestUserMetadata(2)

		return reply(locale.REQUEST_PING, {
			socket: [commanifier(Math.round(ping))]
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

	/**
	 * permissionLevel is a new property in command class object, a lot of commands don't have this property yet.
	 * Make sure to add this new property if you are working on the command. Otherwise, it won't work.
	 */
	permissionLevel: 0,


	public: true,
	required_usermetadata: false,
	multiUser: false
}