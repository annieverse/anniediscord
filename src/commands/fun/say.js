"use strict"
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require(`discord.js`)
const { isSlash } = require(`../../utils/appCmdHelp`)
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
    server_specific: false,
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        { name: `message`, description: `Type your message to be said by annie`, required: true, type: ApplicationCommandOptionType.String }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        if (!arg) return await reply.send(locale.SAY.SHORT_GUIDE, {
            socket: {
                emoji: await client.getEmoji(`AnnieNyaa`)
            }
        })
        return await this.run(arg, message, reply)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        return await this.run(options.getString(`message`), interaction, reply)
    },
    async run(msg, messageRef, reply) {
        const _isSlash = isSlash(messageRef)
        if (_isSlash) {
            reply.send(`Message sent :P`, { ephemeral: true })
        }
        return reply.send(msg, {
            field: messageRef.channel,
            sendAnyway: true
        })
    }
}