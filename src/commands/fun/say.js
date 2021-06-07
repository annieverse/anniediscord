/**
 * Talk through bot.
 * @author klerikdust
 */
module.exports = {
    name: `say`,
	aliases: [],
	description: `Talk through Annie!`,
	usage: `say <Message>`,
	permissionLevel: 3,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return reply.send(locale.SAY.SHORT_GUIDE, {
            socket: {
                emoji: await client.getEmoji(`AnnieNyaa`)
            }
        })
		message.delete()
		return reply.send(arg)
    }
}
