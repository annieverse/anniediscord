module.exports = (bot,member) => {

	var metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (bot.WANT_CUSTOM_LOGS && bot.guildMemberRemove) new bot.logSystem(metadata).record()
}