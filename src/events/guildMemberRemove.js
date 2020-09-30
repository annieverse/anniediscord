module.exports = async (bot,member, configs) => {

	var metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (configs.get(`LOGS_MODULE`).value && configs.get(`GUILD_MEMBER_REMOVE`).value) new bot.logSystem(metadata).record()
}