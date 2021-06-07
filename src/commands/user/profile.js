const GUI = require(`../../ui/prebuild/profile`)
const User = require(`../../libs/user`)
/**
 * Displaying user's profile card!
 * @author klerikdust
 */
module.exports = {
    name: `profile`,
	aliases: [`profile`, `p`, `prof`],
	description: `Displaying user's profile card!`,
	usage: `profile <User>(Optional)`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        const fetching = await reply.send(locale.PROFILECARD.FETCHING, {
            socket: {emoji: await client.getEmoji(`790994076257353779`)}
        })
        const userData = await userLib.requestMetadata(targetUser, 2)
        await reply.send(locale.COMMAND.TITLE, {
            socket: {
                user: targetUser.username,
                emoji: await client.getEmoji(`692428927620087850`),
                command: `Profile`
            },
            image: (await new GUI(userData, client).build()).toBuffer(),
            prebuffer: true,
            simplified: true 
        })
        return fetching.delete()
    }
}
