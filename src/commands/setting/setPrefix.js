"use strict"
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
    multiUser: false,
    applicationCommand: false,
    messageCommand: true,
    prefixImmune: true,
    async execute(client, reply, message, arg, locale, prefix) {
        if (!arg) return await reply.send(locale.SETPREFIX.CURRENT_SET, {
            image: `banner_setprefix`,
            socket: {
                guild: message.guild.name,
                prefix: message.guild.configs.get(`PREFIX`).value
            }
        })
        client.db.guildUtils.updateGuildConfiguration({
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
        return await reply.send(locale.SETPREFIX.FOLLOW_UP, {
            simplified: true,
            socket: {
                prefix: arg
            }
        })
    }
}