const GUI = require(`../../ui/prebuild/level`)
const User = require(`../../libs/user`)
/**
 * Display your current exp, level and rank.
 * @author klerikdust
 */
module.exports = {
    name: `level`,
	aliases: [`lvl`, `lv`],
	description: `Display your current exp, level and rank.`,
	usage: `level <User>(Optional)`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
		//  Handle if the EXP module isn't enabled in current guild
		if (!message.guild.configs.get(`EXP_MODULE`).value) return reply.send(locale.COMMAND.DISABLED, {
			socket: {command: `EXP Module`},
		})
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
		if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Normalize structure
        targetUser = targetUser.master || targetUser
        const userData = await userLib.requestMetadata(targetUser, 2)
		reply.send(locale.COMMAND.FETCHING, {
			simplified: true,
			socket: {
				emoji: await client.getEmoji(`790994076257353779`), 
				user: targetUser.id,
				command: `level`
			}
		})
		.then(async loading => {
			await reply.send(locale.COMMAND.TITLE, {
				simplified: true,
				prebuffer: true,
				image: await new GUI(userData).build(),
				socket: {
					emoji: await client.getEmoji(`692428597570306218`),
					user: message.author.username,
					command: `Level`
				}
			})
			return loading.delete()
		})
    }
}
