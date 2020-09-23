module.exports = async (bot,member, configs) => {

	var metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (configs.get(`LOG_MODULE`).value && configs.get(`GUILD_MEMBER_REMOVE`).value) new bot.logSystem(metadata).record()
}