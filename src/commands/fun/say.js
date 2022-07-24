const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
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
    applicationCommand: true,
    options: [
        {name: `message`, description: `Message to be said`, required: true, type: ApplicationCommandOptionType.String}
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return reply.send(locale.SAY.SHORT_GUIDE, {
            socket: {
                emoji: await client.getEmoji(`AnnieNyaa`)
            }
        })
        message.delete()
        return reply.send(arg)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return reply.send(interaction.options.getString(`message`))
    }
}