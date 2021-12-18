const superagent = require(`superagent`)
const User = require(`../../libs/user`)
/**
 * Displays a random gif of a pat.
 * @author klerikdust
 */
module.exports = {
    name: `pat`,
    aliases: [],
    description: `Displays a random gif of a pat.`,
    usage: `pat <User>(Optional)`,
    permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
        const {
            body
        } = await superagent.get(`https://purrbot.site/api/img/sfw/pat/gif`)
        //  Multi-user hug
        if (arg) {
            const target = await (new User(client, message)).lookFor(arg)
            if (!target) return reply.send(locale.PAT.INVALID_TARGET, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            })
            return reply.send(locale.PAT.OTHER_USER, {
                socket: {
                    user: message.author.username,
                    targetUser: target.master.username
                },
                imageGif: body.link
            })
        }
        return reply.send(locale.PAT.THEMSELVES, {
            socket: {
                user: message.author.username
            },
            imageGif: body.link
        })
    }
}