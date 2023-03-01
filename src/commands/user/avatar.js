const { EmbedBuilder } = require(`discord.js`)
const User = require(`../../libs/user`)
const { crimson } = require(`../../ui/colors/default`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
    /**
     * Display user's avatar
     * @author klerikdust
     */
module.exports = {
    name: `avatar`,
    aliases: [`ava`, `pfp`],
    description: `Display user's avatar`,
    usage: `avatar <user>`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    options: [
        {
            name: `user`,
            description: `User you wish to display avatar of`,
            required: false,
            type: ApplicationCommandOptionType.User
        }
    ],
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {
        let targetUser = arg ? await (new User(client, message)).lookFor(arg) : message.author
        if (!targetUser) return await reply.send(locale.USER.IS_INVALID)
            //  Normalize structure
        targetUser = targetUser.master || targetUser
        await message.react(`📸`)
        const [avatar, name] = [targetUser.displayAvatarURL({ extension: `png`, forceStatic: true, size: 512 }), targetUser.username]
        const embed = new EmbedBuilder()
            .setImage(avatar)
            .setAuthor({name:name, iconURL:avatar})
            .setColor(crimson)
        return message.channel.send({embeds:[embed]})
    },
    async Iexecute(client, reply, interaction, options, locale) {
        const target = options.getUser(`user`) || interaction.member.user
        const [avatar, name] = [target.displayAvatarURL({ forceStatic: false, size: 512 }), target.username]
        const embed = new EmbedBuilder()
            .setImage(avatar)
            .setAuthor({name:name, iconURL:avatar})
            .setColor(crimson)
        return interaction.reply({embeds:[embed]})
    }
}