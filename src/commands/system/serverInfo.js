const moment = require(`moment`)
const commanifier = require(`../../utils/commanifier`)

const { ApplicationCommandType } = require(`discord.js`)
    /**
     * Displays info about the server
     * @author klerikdust
     */
module.exports = {
    name: `serverinfo`,
    aliases: [`guildinfo`, `infoguild`, `serverinfo`, `infoserver`, `aboutserver`],
    description: `Displays info about the server`,
    usage: `serverinfo`,
    permissionLevel: 0,
    multiUser: false,
    applicationCommand: true,
    messageCommand: true,
    type: ApplicationCommandType.ChatInput,
    async execute(client, reply, message, arg, locale) {        
        if (!message.guild.available) message.guild.fetch()
        await message.guild.members.fetch()
        let userSize = message.guild.members.cache.filter(member => !member.user.bot).size
        let botSize = message.guild.members.cache.filter(member => member.user.bot).size
        return await reply.send(`
			A guild with their preferred language as \`${message.guild.preferredLocale}\`
			Owned by **${(await message.guild.fetchOwner()).user.username}**

			**• When the guild was found?**
			It's exactly ${moment(message.guild.createdAt).fromNow()}.
			and I saw you were joining to this server ${moment(message.member.joinedAt).fromNow()}.

			**• How many members do we have?**
			I can smell ${commanifier(userSize)} hoomans are currently living in this guild and the rest ${commanifier(botSize)} creatures are my friend. x)

			**• Hmm, what about the channels and roles?**
			Hah! they have ${message.guild.channels.cache.size} channels and ${message.guild.roles.cache.size} roles!
			Is that what you are looking for?
			Wait, they also have ${message.guild.systemChannel} as their main channel.

			Okay, that's all I know! 

		`, {
            header: message.guild.name,
            thumbnail: message.guild.iconURL()
        })
    },
    async Iexecute(client, reply, interaction, options, locale) {
        if (!interaction.guild.available) interaction.guild.fetch()
        await interaction.guild.members.fetch()
        let userSize = interaction.guild.members.cache.filter(member => !member.user.bot).size
        let botSize = interaction.guild.members.cache.filter(member => member.user.bot).size
        return await reply.send(`
			A guild with their preferred language as \`${interaction.guild.preferredLocale}\`
			Owned by **${(await interaction.guild.fetchOwner()).user.username}**

			**• When the guild was found?**
			It's exactly ${moment(interaction.guild.createdAt).fromNow()}.
			and I saw you were joining to this server ${moment(interaction.member.joinedAt).fromNow()}.

			**• How many members do we have?**
			I can smell ${commanifier(userSize)} hoomans are currently living in this guild and the rest ${commanifier(botSize)} creatures are my friend. x)

			**• Hmm, what about the channels and roles?**
			Hah! they have ${interaction.guild.channels.cache.size} channels and ${interaction.guild.roles.cache.size} roles!
			Is that what you are looking for?
			Wait, they also have ${interaction.guild.systemChannel} as their main channel.

			Okay, that's all I know! 

		`, {
            header: interaction.guild.name,
            thumbnail: interaction.guild.iconURL()
        })
    }
}