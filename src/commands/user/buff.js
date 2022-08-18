const { ApplicationCommandType } = require(`discord.js`)
const ms = require(`ms`)
    /**
     * Displaying your currently active buffs.
     * @author klerikdust
     */
module.exports = {
    name: `buff`,
    aliases: [`buffs`, `buff`, `activebuff`],
    description: `Displaying your currently active buffs`,
    usage: `buff`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const buffs = await client.db.getSavedUserDurationalBuffs(message.author.id)
        if (!buffs.length) return reply.send(locale.BUFF.NO_ACTIVE_BUFFS, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        let str = ``
        for (let i = 0; i < buffs.length; i++) {
            const buff = buffs[i]
            const localTime = await client.db.toLocaltime(buff.registered_at)
            const expireAt = new Date(localTime).getTime() + buff.duration
            str += `╰☆～(${buff.multiplier*100}%)(${ms(new Date(expireAt).getTime() - Date.now(), {long:true})}) ${buff.type} boost from **'${buff.name}'** buff.\n`
        }
        return reply.send(str, {
            customHeader: [`${message.author.username}'s Active Buffs`, message.author.displayAvatarURL()]
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const buffs = await client.db.getSavedUserDurationalBuffs(interaction.member.id)
        if (!buffs.length) return reply.send(locale.BUFF.NO_ACTIVE_BUFFS, {
            socket: {
                emoji: await client.getEmoji(`AnnieHeartPeek`)
            }
        })
        let str = ``
        for (let i = 0; i < buffs.length; i++) {
            const buff = buffs[i]
            const localTime = await client.db.toLocaltime(buff.registered_at)
            const expireAt = new Date(localTime).getTime() + buff.duration
            str += `╰☆～(${buff.multiplier*100}%)(${ms(new Date(expireAt).getTime() - Date.now(), {long:true})}) ${buff.type} boost from **'${buff.name}'** buff.\n`
        }
        return reply.send(str, {
            customHeader: [`${interaction.member.user.username}'s Active Buffs`, interaction.member.displayAvatarURL()]
        })
    }
}