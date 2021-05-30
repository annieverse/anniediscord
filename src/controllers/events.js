const reqEvent = (event) => require(`../events/${event}.js`)
module.exports = annie => {
	annie.once(`ready`, () => reqEvent(`ready`)(annie))
	annie.on(`error`, (e) => reqEvent(`error`)(annie, e))
	annie.on(`message`, (message) => reqEvent(`message`)(client, message))
	annie.on(`guildCreate`, (guild) => reqEvent(`guildCreate`)(annie, guild))
	annie.on(`guildDelete`, (guild) => reqEvent(`guildDelete`)(annie, guild))
	if (!annie.dev) {
		/** --------------------------------------
		 *  Everything below this is used for logging purpose
		 *  --------------------------------------
		 */
		annie.on(`messageUpdate`, (oldMessage, newMessage) => reqEvent(`messageUpdate`)(annie, oldMessage, newMessage))
		annie.on(`messageDelete`, (message) => reqEvent(`messageDelete`)(annie, message))
		annie.on(`messageDeleteBulk`, (messages) => reqEvent(`messageDeleteBulk`)(annie, messages))
		annie.on(`roleCreate`, (role) => reqEvent(`roleCreate`)(annie, role))
		annie.on(`roleDelete`, (role) => reqEvent(`roleDelete`)(annie, role))
		annie.on(`roleUpdate`, (oldRole, newRole) => reqEvent(`roleUpdate`)(annie, oldRole, newRole))
		annie.on(`emojiCreate`, (emoji) => reqEvent(`emojiCreate`)(annie, emoji))
		annie.on(`emojiDelete`, (emoji) => reqEvent(`emojiDelete`)(annie, emoji))
		annie.on(`emojiUpdate`, (oldEmoji, newEmoji) => reqEvent(`emojiUpdate`)(annie, oldEmoji, newEmoji))
		annie.on(`channelDelete`, (channel) => reqEvent(`channelDelete`)(annie, channel))
		annie.on(`channelUpdate`, (oldChannel, newChannel) => reqEvent(`channelUpdate`)(annie, oldChannel, newChannel))
		annie.on(`channelCreate`, (channel) => reqEvent(`channelCreate`)(annie, channel))
		annie.on(`guildBanAdd`, (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user))
		annie.on(`guildBanRemove`, (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user))
		annie.on(`guildMemberAdd`, (member) => reqEvent(`guildMemberAdd`)(annie, member))
		annie.on(`guildMemberRemove`, (member) => reqEvent(`guildMemberRemove`)(annie, member))
	}
}
