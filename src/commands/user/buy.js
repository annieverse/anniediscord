/**
 * Buy any purchasable items our shop!
 * @author klerikdust
 */
module.exports = {
    name: `buy`,
	aliases: [`purchase`, `buyy`],
	description: `Buy any purchasable items in our shop!`,
	usage: `buy <ItemID/ItemName>`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
		return reply.send(locale.SHOP.TEMPORARILY_CLOSED, {socket:{emoji: await client.getEmoji(`692428785571856404`)}})
    }
}
