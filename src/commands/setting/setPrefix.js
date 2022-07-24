/**
 * Customize prefix per guild setting.
 * @author klerikdust
 */
module.exports = {
    name: `setprefix`,
    aliases: [`setprefix`, `setpr`, `setpref`, `setprfx`, `setprefixs`],
    description: `Customize prefix per guild setting`,
    usage: `setprefix <NewPrefix>`,
    permissionLevel: 3,
    prefixImmune: true,
    applicationCommand: false,
    async execute(client, reply, message, arg, locale, prefix) {
        if (!arg) return reply.send(locale.SETPREFIX.CURRENT_SET, {
            image: `banner_setprefix`,
            socket: {
                guild: message.guild.name,
                prefix: message.guild.configs.get(`PREFIX`).value
            }
        })
        client.db.updateGuildConfiguration({
            configCode: `PREFIX`,
            customizedParameter: arg,
            guild: message.guild,
            setByUserId: message.author.id,
            cacheTo: message.guild.configs
        })
        await reply.send(locale.SETPREFIX.SUCCESSFUL, {
            status: `success`,
            socket: {
                prefix: arg,
                emoji: await client.getEmoji(`789212493096026143`)
            }
        })
        return reply.send(locale.SETPREFIX.FOLLOW_UP, {
            simplified: true,
            socket: {
                prefix: arg
            }
        })
    }
}