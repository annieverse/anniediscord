const reqEvent = (event) => require(`../events/${event}.js`)
const MessageController = require(`./messages`)
 

module.exports = annie => {
	const fetchGuildConfigs = (id) => annie.guilds.cache.get(id).configs
	//	Cached message
	let message_object
	annie.on(`ready`, () => reqEvent(`ready`)(annie))
	annie.on(`error`, (e) => reqEvent(`error`)(annie, e, message_object))
	annie.on(`warn`, (e) => reqEvent(`warn`)(annie, e, message_object))
	annie.on(`message`, (message) => {
		message_object = message
		new MessageController({bot:annie, message}).run(false)
	})
	annie.on(`guildCreate`, (guild) => reqEvent(`guildCreate`)(annie, guild, fetchGuildConfigs(`577121315480272908`)))
	annie.on(`guildDelete`, (guild) => reqEvent(`guildDelete`)(annie, guild, fetchGuildConfigs(`577121315480272908`)))
	if (!annie.dev) {

		/** --------------------------------------
		 *  Everything below this is used for logging purpose
		 *  --------------------------------------
		 */
		annie.on(`messageUpdate`, (oldMessage, newMessage) => reqEvent(`messageUpdate`)(annie, oldMessage, newMessage, fetchGuildConfigs(oldMessage.guild.id)))
		annie.on(`messageDelete`, (message) => reqEvent(`messageDelete`)(annie, message, fetchGuildConfigs(message.guild.id)))
		annie.on(`messageDeleteBulk`, (messages) => reqEvent(`messageDeleteBulk`)(annie, messages, fetchGuildConfigs(messages.first().guild.id)))
		annie.on(`roleCreate`, (role) => reqEvent(`roleCreate`)(annie, role, fetchGuildConfigs(role.guild.id)))
		annie.on(`roleDelete`, (role) => reqEvent(`roleDelete`)(annie, role, fetchGuildConfigs(role.guild.id)))
		annie.on(`roleUpdate`, (oldRole, newRole) => reqEvent(`roleUpdate`)(annie, oldRole, newRole, fetchGuildConfigs(oldRole.guild.id)))
		annie.on(`emojiCreate`, (emoji) => reqEvent(`emojiCreate`)(annie, emoji, fetchGuildConfigs(emoji.guild.id)))
		annie.on(`emojiDelete`, (emoji) => reqEvent(`emojiDelete`)(annie, emoji, fetchGuildConfigs(emoji.guild.id)))
		annie.on(`emojiUpdate`, (oldEmoji, newEmoji) => reqEvent(`emojiUpdate`)(annie, oldEmoji, newEmoji, fetchGuildConfigs(oldEmoji.guild.id)))
		annie.on(`channelDelete`, (channel) => reqEvent(`channelDelete`)(annie, channel, fetchGuildConfigs(channel.guild.id)))
		annie.on(`channelUpdate`, (oldChannel, newChannel) => reqEvent(`channelUpdate`)(annie, oldChannel, newChannel, fetchGuildConfigs(oldChannel.guild.id)))
		annie.on(`channelCreate`, (channel) => reqEvent(`channelCreate`)(annie, channel, channel.type != `dm` ? fetchGuildConfigs(channel.guild.id) : null))
		annie.on(`guildBanAdd`, (guild, user) => reqEvent(`guildBanAdd`)(annie, guild, user, fetchGuildConfigs(guild.id)))
		annie.on(`guildBanRemove`, (guild, user) => reqEvent(`guildBanRemove`)(annie, guild, user, fetchGuildConfigs(guild.id)))
		annie.on(`guildMemberAdd`, (member) => reqEvent(`guildMemberAdd`)(annie, member, fetchGuildConfigs(member.guild.id)))
		annie.on(`guildMemberRemove`, (member) => reqEvent(`guildMemberRemove`)(annie, member, fetchGuildConfigs(member.guild.id)))

		/** --------------------------------------
		 *  Miscelanous Events
		 *  --------------------------------------
		 */		
		//annie.on(`shardReconnecting`, (annie) => reqEvent(`reconnecting`)(annie)) // Support Server only
		//annie.on(`disconnect`, (annie) => reqEvent(`disconnect`)(annie)) // not guild dependent
		//annie.on(`messageReactionAdd`, async (reaction, user) => reqEvent(`messageReactionAdd`)({annie, reaction, user, message_object}, fetchGuildConfigs(reaction.message.guild.id)))
		//annie.on(`messageReactionRemove`, async (reaction, user) => reqEvent(`messageReactionRemove`)({annie, reaction, user, message_object}, fetchGuildConfigs(reaction.message.guild.id)))
		//annie.on(`raw`, async (packet) => reqEvent(`raw`)(annie, packet))
	}

}
