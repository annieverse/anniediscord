const reqEvent = (event) => require(`../events/${event}.js`)
const MessageController = require(`./messages`)

module.exports = annie => {
	//	Cached message
	let message_object
	annie.on(`ready`, async() => reqEvent(`ready`)(annie))
	annie.on(`error`, async (e) => reqEvent(`error`)(annie, e, message_object))
	annie.on(`warn`, async (e) => reqEvent(`warn`)(annie, e, message_object))
	annie.on(`message`, async(message) => {
		message_object = message
		new MessageController({bot:annie, message}).run(false)
	})

	annie.on(`guildCreate`, async (guild) => reqEvent(`guildCreate`)(annie, guild))
	annie.on(`guildDelete`, async (guild) => reqEvent(`guildDelete`)(annie, guild))
	annie.on(`guildBanAdd`, async (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user))
	annie.on(`guildBanRemove`, async (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user))
	if (!annie.dev) {
		annie.on(`shardReconnecting`, (annie) => reqEvent(`reconnecting`)(annie))
		annie.on(`disconnect`, (annie) => reqEvent(`disconnect`)(annie))
		annie.on(`guildMemberAdd`, async(member) => reqEvent(`guildMemberAdd`)(annie, member))
		annie.on(`guildMemberRemove`, async (member) => reqEvent(`guildMemberRemove`)(annie, member))
		annie.on(`guildMemberUpdate`, async(oldUser, newUser) => reqEvent(`guildMemberUpdate`)(annie, oldUser, newUser))
		annie.on(`messageReactionAdd`, async (reaction, user) => reqEvent(`messageReactionAdd`)({annie, reaction, user, message_object}))
		annie.on(`messageReactionRemove`, async (reaction, user) => reqEvent(`messageReactionRemove`)({annie, reaction, user, message_object}))
		annie.on(`voiceStateUpdate`, async (oldState, newState) => reqEvent(`voiceStateUpdate`)(annie, oldState, newState))
		annie.on(`raw`, async (packet) => reqEvent(`raw`)(annie, packet))
		// Mostly for Logging only
		annie.on(`channelCreate`, async (channel) => reqEvent(`channelCreate`)(annie, channel))
		annie.on(`channelDelete`, async (channel) => reqEvent(`channelDelete`)(annie, channel))
		annie.on(`channelUpdate`, async (oldChannel, newChannel) => reqEvent(`channelUpdate`)(annie, oldChannel, newChannel))
		annie.on(`roleCreate`, async (role) => reqEvent(`roleCreate`)(annie, role))
		annie.on(`roleDelete`, async (role) => reqEvent(`roleDelete`)(annie, role))
		annie.on(`roleUpdate`, async (oldRole, newRole) => reqEvent(`roleUpdate`)(annie, oldRole, newRole))
		annie.on(`messageDeleteBulk`, async (messages) => reqEvent(`messageDeleteBulk`)(annie, messages))
		annie.on(`messageDelete`, async (message) => reqEvent(`messageDelete`)(annie, message))
		annie.on(`messageUpdate`, async (oldMessage, newMessage) => reqEvent(`messageUpdate`)(annie, oldMessage, newMessage))
		annie.on(`emojiCreate`, async (emoji) => reqEvent(`emojiCreate`)(annie, emoji))
		annie.on(`emojiDelete`, async (emoji) => reqEvent(`emojiDelete`)(annie, emoji))
		annie.on(`emojiUpdate`, async (oldEmoji, newEmoji) => reqEvent(`emojiUpdate`)(annie, oldEmoji, newEmoji))

		annie.on(`guildUnavailable`, async (guild) => reqEvent(`guildMemberAdd`)(annie, guild))
		annie.on(`guildUpdate`, async (oldGuild, newGuild) => reqEvent(`guildUpdate`)(annie, oldGuild, newGuild))
		annie.on(`guildMembersChunk`, async (members, guild) => reqEvent(`guildMembersChunk`)(annie, members, guild))
	}

}
