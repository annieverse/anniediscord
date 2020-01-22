const reqEvent = (event) => require(`../events/${event}.js`)
const env = require(`../../.data/environment.json`)

module.exports = bot => {

	//	Handle global rejection
	process.on(`unhandledRejection`, (err) => reqEvent(`unhandledRejection`)(bot, err))

	//	Cached message
	let message_object

	bot.on(`ready`, async() => reqEvent(`ready`)(bot))
	bot.on(`error`, async (e) => reqEvent(`error`)(bot, e, message_object))
	bot.on(`warn`, async (e) => reqEvent(`warn`)(bot, e, message_object))
	bot.on(`message`, async(message) => {
		message_object = message
		reqEvent(`message`)(bot, message)
	})

	bot.on(`guildCreate`, async (guild) => reqEvent(`guildCreate`)(bot, guild))
	bot.on(`guildDelete`, async (guild) => reqEvent(`guildDelete`)(bot, guild))

	bot.on(`guildBanAdd`, async (guild, user) => reqEvent(`guildBanAdd`)(bot, guild, user))
	bot.on(`guildBanRemove`, async (guild, user) => reqEvent(`guildBanRemove`)(bot, guild, user))

	if (!env.dev) {
		bot.on(`presenceUpdate`, async (oldMember, newMember) => reqEvent(`presenceUpdate`)({bot, oldMember, newMember}))
		bot.on(`reconnecting`, (bot) => reqEvent(`reconnecting`)(bot))
		bot.on(`disconnect`, (bot) => reqEvent(`disconnect`)(bot))
		bot.on(`guildMemberAdd`, async(member) => reqEvent(`guildMemberAdd`)(bot, member))
		bot.on(`guildMemberRemove`, async (member) => reqEvent(`guildMemberRemove`)(bot, member))
		bot.on(`guildMemberUpdate`, async(oldUser, newUser) => reqEvent(`guildMemberUpdate`)(bot, oldUser, newUser))
		bot.on(`messageReactionAdd`, async (reaction, user) => reqEvent(`messageReactionAdd`)({bot, reaction, user, message_object}))
		bot.on(`messageReactionRemove`, async (reaction, user) => reqEvent(`messageReactionRemove`)({bot, reaction, user, message_object}))
		bot.on(`voiceStateUpdate`, async (oldMember, newMember) => reqEvent(`voiceStateUpdate`)(bot, oldMember, newMember))
		bot.on(`raw`, async (packet) => reqEvent(`raw`)(bot, packet))
		// Mostly for Logging only
		bot.on(`channelCreate`, async (channel) => reqEvent(`channelCreate`)(bot, channel))
		bot.on(`channelDelete`, async (channel) => reqEvent(`channelDelete`)(bot, channel))
		bot.on(`channelUpdate`, async (oldChannel, newChannel) => reqEvent(`channelUpdate`)(bot, oldChannel, newChannel))
		bot.on(`roleCreate`, async (role) => reqEvent(`roleCreate`)(bot, role))
		bot.on(`roleDelete`, async (role) => reqEvent(`roleDelete`)(bot, role))
		bot.on(`roleUpdate`, async (oldRole, newRole) => reqEvent(`roleUpdate`)(bot, oldRole, newRole))
		bot.on(`messageDelete`, async (message) => reqEvent(`messageDelete`)(bot, message))
		bot.on(`messageDeleteBulk`, async (messages) => reqEvent(`messageDeleteBulk`)(bot, messages))
		bot.on(`messageUpdate`, async (oldMessage, newMessage) => reqEvent(`messageUpdate`)(bot, oldMessage, newMessage))
		bot.on(`emojiCreate`, async (emoji) => reqEvent(`emojiCreate`)(bot, emoji))
		bot.on(`emojiDelete`, async (emoji) => reqEvent(`emojiDelete`)(bot, emoji))
		bot.on(`emojiUpdate`, async (oldEmoji, newEmoji) => reqEvent(`emojiUpdate`)(bot, oldEmoji, newEmoji))

		bot.on(`guildUnavailable`, async (guild) => reqEvent(`guildMemberAdd`)(bot, guild))
		bot.on(`guildUpdate`, async (oldGuild, newGuild) => reqEvent(`guildUpdate`)(bot, oldGuild, newGuild))
		bot.on(`guildMembersChunk`, async (members, guild) => reqEvent(`guildMembersChunk`)(bot, members, guild))
	}

}
