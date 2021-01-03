module.exports = async (bot,member) => {
	let metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `GUILD_MEMBER_REMOVE`,
		bot: bot
	}
	if (bot.fetchGuildConfigs(member.guild.id).get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}