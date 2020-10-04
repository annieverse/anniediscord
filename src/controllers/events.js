const reqEvent = (event) => require(`../events/${event}.js`)
const MessageController = require(`./messages`)
 

module.exports = annie => {
	const fetchGuildConfigs = (id) => annie.guilds.cache.get(id).configs
	//	Cached message
	let message_object
	annie.on(`ready`, async() => reqEvent(`ready`)(annie))
	annie.on(`error`, async (e) => reqEvent(`error`)(annie, e, message_object))
	annie.on(`warn`, async (e) => reqEvent(`warn`)(annie, e, message_object))
	annie.on(`message`, async(message) => {
		message_object = message
		new MessageController({bot:annie, message}).run(false)
	})
	annie.on(`guildCreate`, async (guild) => reqEvent(`guildCreate`)(annie, guild, fetchGuildConfigs(`577121315480272908`)))
	annie.on(`guildDelete`, async (guild) => reqEvent(`guildDelete`)(annie, guild, fetchGuildConfigs(`577121315480272908`)))
	annie.on(`guildMemberAdd`, async(member) => reqEvent(`guildMemberAdd`)(annie, member, fetchGuildConfigs(member.guild.id)))
	if (!annie.dev) {

		/** --------------------------------------
		 *  Everything below this is used for logging purpose
		 *  --------------------------------------
		 */
		annie.on(`messageUpdate`, async (oldMessage, newMessage) => reqEvent(`messageUpdate`)(annie, oldMessage, newMessage, fetchGuildConfigs(oldMessage.guild.id)))
		annie.on(`messageDelete`, async (message) => reqEvent(`messageDelete`)(annie, message, fetchGuildConfigs(message.guild.id)))
		annie.on(`messageDeleteBulk`, async (messages) => reqEvent(`messageDeleteBulk`)(annie, messages, fetchGuildConfigs(messages.first().guild.id)))
		annie.on(`roleCreate`, async (role) => reqEvent(`roleCreate`)(annie, role, fetchGuildConfigs(role.guild.id)))
		annie.on(`roleDelete`, async (role) => reqEvent(`roleDelete`)(annie, role, fetchGuildConfigs(role.guild.id)))
		annie.on(`roleUpdate`, async (oldRole, newRole) => reqEvent(`roleUpdate`)(annie, oldRole, newRole, fetchGuildConfigs(oldRole.guild.id)))
		annie.on(`emojiCreate`, async (emoji) => reqEvent(`emojiCreate`)(annie, emoji, fetchGuildConfigs(emoji.guild.id)))
		annie.on(`emojiDelete`, async (emoji) => reqEvent(`emojiDelete`)(annie, emoji, fetchGuildConfigs(emoji.guild.id)))
		annie.on(`emojiUpdate`, async (oldEmoji, newEmoji) => reqEvent(`emojiUpdate`)(annie, oldEmoji, newEmoji, fetchGuildConfigs(oldEmoji.guild.id)))
		annie.on(`channelDelete`, async (channel) => reqEvent(`channelDelete`)(annie, channel, fetchGuildConfigs(channel.guild.id)))
		annie.on(`channelUpdate`, async (oldChannel, newChannel) => reqEvent(`channelUpdate`)(annie, oldChannel, newChannel, fetchGuildConfigs(oldChannel.guild.id)))
		annie.on(`channelCreate`, async (channel) => reqEvent(`channelCreate`)(annie, channel, channel.type != `dm` ? fetchGuildConfigs(channel.guild.id) : null))
		annie.on(`guildBanAdd`, async (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user, fetchGuildConfigs(guild.id)))
		annie.on(`guildBanRemove`, async (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user, fetchGuildConfigs(guild.id)))
		annie.on(`guildMemberAdd`, async(member) => reqEvent(`guildMemberAdd`)(annie, member, fetchGuildConfigs(member.guild.id)))
		annie.on(`guildMemberRemove`, async (member) => reqEvent(`guildMemberRemove`)(annie, member, fetchGuildConfigs(member.guild.id)))

		/** --------------------------------------
		 *  Miscelanous Events
		 *  --------------------------------------
		 */		
		annie.on(`shardReconnecting`, (annie) => reqEvent(`reconnecting`)(annie)) // Support Server only
		annie.on(`disconnect`, (annie) => reqEvent(`disconnect`)(annie)) // not guild dependent
		annie.on(`messageReactionAdd`, async (reaction, user) => reqEvent(`messageReactionAdd`)({annie, reaction, user, message_object}, fetchGuildConfigs(reaction.message.guild.id)))
		annie.on(`messageReactionRemove`, async (reaction, user) => reqEvent(`messageReactionRemove`)({annie, reaction, user, message_object}, fetchGuildConfigs(reaction.message.guild.id)))
		annie.on(`raw`, async (packet) => reqEvent(`raw`)(annie, packet))
	}

}
