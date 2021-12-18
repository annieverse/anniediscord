const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Displaying user's current balance
 * @author klerikdust
 */
module.exports = {
	name: `balance`,
	aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
	description: `Displaying user's current balance`,
	usage: `balance`,
	permissionLevel: 0,
	async execute(client, reply, message, arg, locale) {
		const userLib = new User(client, message)
		let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return reply.send(locale.USER.IS_INVALID)
		//  Normalize structure
		targetUser = targetUser.master || targetUser
		const targetUserBalance = await client.db.getUserBalance(targetUser.id, message.guild.id)
		return reply.send(locale.DISPLAY_BALANCE, {
			thumbnail: targetUser.displayAvatarURL(),
			socket: {
				emoji: await client.getEmoji(`758720612087627787`),
				amount: commanifier(targetUserBalance),
				tips: targetUser.id === message.author.id ? `Use **\`${client.prefix}pay\`** to share with friends!` : ` `
			}
		})
	}
}