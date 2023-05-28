"use strict"
const GUI = require(`../../ui/prebuild/profile`)
const User = require(`../../libs/user`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
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
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `user`,
        description: `Display the profile of the specified user`,
        required: false,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
            //  Normalize structure
        targetUser = targetUser.master || targetUser
        const fetching = await reply.send(locale.PROFILECARD.FETCHING, {
            socket: { emoji: await client.getEmoji(`790994076257353779`) }
        })
        const userData = await userLib.requestMetadata(targetUser, 2,locale)
        const image = (await new GUI(userData, client).build()).png()
        fetching.delete()
        return await reply.send(locale.COMMAND.TITLE, {
            socket: {
                user: targetUser.username,
                emoji: await client.getEmoji(`692428927620087850`),
                command: `Profile`
            },
            image: image,
            prebuffer: true,
            simplified: true
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const userLib = new User(client, interaction)
        let targetUser = options.getUser(`user`) || interaction.member.user
        const fetching = await reply.send(locale.PROFILECARD.FETCHING, {
            socket: { emoji: await client.getEmoji(`790994076257353779`) }
        })
        const userData = await userLib.requestMetadata(targetUser, 2,locale)
        const image = (await new GUI(userData, client).build()).png()
        fetching.delete()
        return await reply.send(locale.COMMAND.TITLE, {
            socket: {
                user: targetUser.username,
                emoji: await client.getEmoji(`692428927620087850`),
                command: `Profile`
            },
            image: image,
            prebuffer: true,
            simplified: true,
            followUp: true
        })
    }
}