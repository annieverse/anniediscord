const moment = require(`moment`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Displays info about the server
 * @author klerikdust
 */
module.exports = {
    name:`serverInfo`,
	aliases: [`guildinfo`, `infoguild`, `serverinfo`, `infoserver`, `aboutserver`],
	description: `Displays info about the server`,
	usage: `serverinfo`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
		let members = message.guild.memberCount
		let botSize =  message.guild.members.cache.filter(a => a.user.bot).size
		let userSize = members - botSize

		return reply.send(`
			${message.guild.region.charAt(0).toUpperCase() + message.guild.region.slice(1)}-based Guild
			Owned by **${await client.getUsername(message.guild.ownerID)}**

			**• When the guild was found?**
			It's exactly ${moment(message.guild.createdAt).fromNow()}.
			and I saw you were joining to this server ${moment(message.member.joinedAt).fromNow()}.

			**• How many members do we have?**
			I can smell ${commanifier(userSize)} hoomans are currently living in this guild and the rest ${commanifier(botSize)} creatures are my friend. x)

			**• Hmm, what about the channels and roles?**
			Hah! they have ${message.guild.channels.cache.size} channels and ${message.guild.roles.cache.size} roles!
			Is that what you are looking for?
			Wait, they also have ${message.guild.channels.cache.get(message.guild.systemChannelID)} as their main channel.

			Okay, that's all I know! 

		`, {
			header: message.guild.name,
			thumbnail: message.guild.iconURL()
		})
    }
}
