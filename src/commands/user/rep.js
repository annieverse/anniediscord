const User = require(`../../libs/user`)
const moment = require(`moment`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Gives a reputation point to a user. Once a day.
     * @author klerikdust
     */
module.exports = {
    name: `rep`,
    aliases: [`reps`, `reputation`, `reputations`, `reputationpoint`, `praise`, `commend`],
    description: `Gives a reputation point to a user. Once a day.`,
    usage: `rep <User>`,
    permissionLevel: 0,
    applicationCommand: false,
    cooldown: [23, `hours`],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        const userData = await userLib.requestMetadata(message.author, 2)
        const now = moment()
        const lastGiveAt = await client.db.toLocaltime(userData.reputations.last_giving_at)
            //  Returns if user's last reps give still under 23 hours.
        if (now.diff(lastGiveAt, this.cooldown[1]) < this.cooldown[0]) return reply.send(locale.GIVE_REPUTATION.IN_COOLDOWN, {
                thumbnail: userData.master.displayAvatarURL(),
                socket: { time: moment(lastGiveAt).add(...this.cooldown).fromNow() },
            })
            //	Displays short-guide if user doesn't specify any parameter
        if (!arg) return reply.send(locale.GIVE_REPUTATION.SHORT_GUIDE, {
            socket: { emoji: await client.getEmoji(`692429004417794058`), prefix: client.prefix }
        })
        const targetUser = await userLib.lookFor(arg)
            //	Handle if target user is invalid    
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            //	Handle if user is trying to rep themselves
        if (userLib.isSelf(targetUser.master.id)) return reply.send(locale.GIVE_REPUTATION.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })
        client.db.updateUserReputation(1, targetUser.master.id, message.author.id, message.guild.id)
        client.db.updateReputationGiver(message.author.id, message.guild.id)
        return reply.send(locale.GIVE_REPUTATION.SUCCESSFUL, {
            status: `success`,
            thumbnail: targetUser.master.displayAvatarURL(),
            socket: { user: targetUser.master.username }
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {}
}