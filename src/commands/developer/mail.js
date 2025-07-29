"use strict"
const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
/**
 * Allows developer to send a private message to reachable user.
 * @author klerikdust
 */
module.exports = {
    name: `mail`,
    aliases: [`mail`, `dm`],
    description: `Allows developer to send a private message to reachable user`,
    usage: `<user> <message>`,
    permissionLevel: 4,
    multiUser: true,
    applicationCommand: false,
    messageCommand: true,
    server_specific: true,
    servers: [`577121315480272908`],
    async execute(client, reply, message, arg, locale) {
        const target = await (new User(client, message)).lookFor(arg)
        if (!target) return reply.send(locale(`MAIL.INVALID_USER`))
        const mailContent = arg.replace(target.usedKeyword + ` `, ``) // Trim additioanl whitespace
        if (!mailContent.length) return reply.send(locale(`MAIL.INVALID_CONTENT_LENGTH`), {
            socket: { emoji: await client.getEmoji(`AnnieThinking`) }
        })
        const confirmation = await reply.send(locale(`MAIL.CONFIRMATION`), {
            socket: { user: target.master, content: mailContent }
        })
        const c = new Confirmator(message, reply, locale)
        await c.setup(message.author.id, confirmation)
        return c.onAccept(async () => {
            try {
                await reply.send(mailContent, {
                    field: target.master,
                    footer: `Sent by Annie's developer`
                })
                return reply.send(locale(`MAIL.SUCCESSFUL`), {
                    socket: { user: target.master, content: mailContent }
                })
            }
            catch (e) {
                return reply.send(locale(`MAIL.UNSUCCESSFUL`), {
                    socket: { emoji: await client.getEmoji(`AnnieRip`) }
                })
            }
        })
    }
}