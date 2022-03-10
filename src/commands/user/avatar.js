const { MessageEmbed } = require(`discord.js`)
const User = require(`../../libs/user`)
const { crimson } = require(`../../ui/colors/default`)
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
    applicationCommand: false,
    async execute(client, reply, message, arg, locale) {
        let targetUser = arg ? await (new User(client, message)).lookFor(arg) : message.author
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
            //  Normalize structure
        targetUser = targetUser.master || targetUser
        await message.react(`📸`)
        const [avatar, name] = [targetUser.displayAvatarURL({ type: `png`, size: 512 }), targetUser.username]
        const embed = new MessageEmbed()
            .setImage(avatar)
            .setAuthor(name, avatar)
            .setColor(crimson)
        return message.channel.send(embed)
    }
}