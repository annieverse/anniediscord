const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
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
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        {name: `message`, description: `Message to be said`, required: true, type: ApplicationCommandOptionType.String}
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale.SAY.SHORT_GUIDE, {
            socket: {
                emoji: await client.getEmoji(`AnnieNyaa`)
            }
        })
        message.delete()
        return await reply.send(arg)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await reply.send(options.getString(`message`))
    }
}