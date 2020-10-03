module.exports = async (bot,member, configs) => {
	let metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `GUILD_MEMBER_REMOVE`,
		bot: bot
	}
	if (configs.get(`LOGS_MODULE`).value) new bot.logSystem(metadata)
}