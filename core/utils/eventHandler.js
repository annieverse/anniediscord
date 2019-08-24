const reqEvent = (event) => require(`../events/${event}.js`)
const env = require(`../../.data/environment.json`)

module.exports = bot => {
	
	//	Cached message
	let message_object

	bot.on(`ready`, async() => reqEvent(`ready`)(bot))
	bot.on(`error`, async (e) => reqEvent(`error`)(bot, e, message_object))
	bot.on(`warn`, async (e) => reqEvent(`warn`)(bot, e, message_object))
	


	/**
	 * 	Will be enabled once the cpu-leak issue has been fixed.
	 */
	//if (env.dev) bot.on(`voiceStateUpdate`, async (oldMember, newMember) => reqEvent(`voiceStateUpdate`)(bot, oldMember, newMember))



	if (!env.dev) {
		bot.on(`guildMemberAdd`, async(member) => reqEvent(`guildMemberAdd`)(bot, member))
		bot.on(`guildMemberRemove`, async(member) => reqEvent(`guildMemberRemove`)(bot, member))
		bot.on(`guildMemberUpdate`, async(oldUser, newUser) => reqEvent(`guildMemberUpdate`)(bot, oldUser, newUser))    
		bot.on(`raw`, async (packet) => reqEvent(`raw`)(bot, packet))
		bot.on(`messageReactionAdd`, async (reaction, user) => reqEvent(`messageReactionAdd`)({bot, reaction, user, message_object}))
		bot.on(`messageReactionRemove`, async (reaction, user) => reqEvent(`messageReactionRemove`)({bot, reaction, user, message_object}))    
	}

	if (env.active_exp) bot.on(`message`, async(message) => reqEvent(`experienceMessage`)(bot, message))
	bot.on(`message`, async(message) => {
		message_object = message
		reqEvent(`message`)(bot, message)
	})
}