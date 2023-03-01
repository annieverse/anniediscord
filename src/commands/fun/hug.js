const {
    ApplicationCommandType,
    ApplicationCommandOptionType
} = require(`discord.js`)
const superagent = require(`superagent`)
const User = require(`../../libs/user`)
/**
 * Displays a random gif of a hug.
 * @author klerikdust
 */
module.exports = {
    name: `hug`,
    aliases: [`hugs`, `hug`],
    description: `Displays a random gif of a hug.`,
    usage: `hug <User>(Optional)`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `user`,
        description: `Any user you would like to hug?`,
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const {
            body
        } = await superagent.get(`https://purrbot.site/api/img/sfw/hug/gif`)
        //  Multi-user hug
        if (arg) {
            const target = await (new User(client, message)).lookFor(arg)
            if (!target) return await reply.send(locale.HUG.INVALID_TARGET, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            })
            return await reply.send(locale.HUG.OTHER_USER, {
                socket: {
                    user: message.author.username,
                    targetUser: target.master.username
                },
                imageGif: body.link
            })
        }
        return await reply.send(locale.HUG.THEMSELVES, {
            socket: {
                user: message.author.username
            },
            imageGif: body.link
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const {
            body
        } = await superagent.get(`https://purrbot.site/api/img/sfw/hug/gif`)
        const target = options.getUser(`user`) 
        !target ? await reply.send(locale.HUG.THEMSELVES, {
            socket: {
                user: interaction.member.user.username
            },
            imageGif: body.link
        }) : await reply.send(locale.HUG.OTHER_USER, {
            socket: {
                user: interaction.member.user.username,
                targetUser: target.username
            },
            imageGif: body.link
        })
    }
}