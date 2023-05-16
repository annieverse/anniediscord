const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Displaying user's current balance
     * @author klerikdust
     */
module.exports = {
    name: `balance`,
    aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
    description: `Displaying user's current balance`,
    usage: `balance`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [
        {
            name: `user`,
            description: `User you wish to display balance of`,
            required: false,
            type: ApplicationCommandOptionType.User
        }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        const userLib = new User(client, message)
        let targetUser = arg ? await userLib.lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
            //  Normalize structure
        targetUser = targetUser.master || targetUser
        const targetUserBalance = await client.db.userUtils.getUserBalance(targetUser.id, message.guild.id)
        return await reply.send(locale.DISPLAY_BALANCE, {
            thumbnail: targetUser.displayAvatarURL(),
            socket: {
                emoji: await client.getEmoji(`758720612087627787`,`577121315480272908`),
                amount: commanifier(targetUserBalance),
                tips: targetUser.id === message.author.id ? `Use **\`${client.prefix}pay\`** to share with friends!` : ` `
            }
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const targetUser = options.getUser(`user`) || interaction.member.user
        const targetUserBalance = await client.db.userUtils.getUserBalance(targetUser.id, interaction.guild.id)
        return await reply.send(locale.DISPLAY_BALANCE, {
            thumbnail: targetUser.displayAvatarURL(),
            socket: {
                emoji: await client.getEmoji(`758720612087627787`),
                amount: commanifier(targetUserBalance),
                tips: targetUser.id === interaction.member.id ? `Use **\`${client.prefix}pay\`** to share with friends!` : ` `
            }
        })
    }
}