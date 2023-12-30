"use strict"
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
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [{
        name: `user`,
        description: `Give a reputation point to the specified user`,
        required: true,
        type: ApplicationCommandOptionType.User
    }],
    type: ApplicationCommandType.ChatInput,
    cooldown: [23, `hours`],
    async execute(client, reply, message, arg, locale) {
        //	Displays short-guide if user doesn't specify any parameter
        if (!arg) return await reply.send(locale.GIVE_REPUTATION.SHORT_GUIDE, {
            socket: { emoji: await client.getEmoji(`692429004417794058`), prefix: client.prefix }
        })        
        const userLib = new User(client, message)
        const targetUser = await userLib.lookFor(arg)
        //	Handle if target user is invalid    
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
        return await this.run(client, reply, message, locale, targetUser, userLib)
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const targetUser = options.getUser(`user`)
        return await this.run(client, reply, interaction, locale, targetUser)
    },
    async run(client, reply, messageRef, locale, user, uLib) {
        const userLib = userLib || new User(client, messageRef)
        const userData = await userLib.requestMetadata(messageRef.member, 2, locale)
        const now = moment()
        const lastGiveAt = await client.db.systemUtils.toLocaltime(userData.reputations.last_giving_at)
        //  Returns if user's last reps give still under 23 hours.
        if (now.diff(lastGiveAt, this.cooldown[1]) < this.cooldown[0]) return await reply.send(locale.GIVE_REPUTATION.IN_COOLDOWN, {
            thumbnail: userData.master.displayAvatarURL(),
            socket: { time: moment(lastGiveAt).add(...this.cooldown).fromNow() },
        })
        const targetUser = user
        //	Handle if user is trying to rep themselves
        if (userLib.isSelf(targetUser.id)) return await reply.send(locale.GIVE_REPUTATION.SELF_TARGETING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })
        client.db.userUtils.updateUserReputation(1, targetUser.id, messageRef.member.id, messageRef.guild.id)
        client.db.userUtils.updateReputationGiver(messageRef.member.id, messageRef.guild.id)
        return await reply.send(locale.GIVE_REPUTATION.SUCCESSFUL, {
            status: `success`,
            thumbnail: targetUser.displayAvatarURL(),
            socket: { user: targetUser.username }
        })
    }
}