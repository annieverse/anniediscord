/**
 * Buy any purchasable items in our shop!
 * @author klerikdust
 */
module.exports = {
    name: `shop`,
	aliases: [`shops`, `marketplace`, `market`],
	description: `Buy any purchasable items in our shop!`,
	usage: `shop`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
		return reply.send(locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji: await client.getEmoji(`692428785571856404`)}})
    }
}
