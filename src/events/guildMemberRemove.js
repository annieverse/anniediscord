module.exports = async (bot,member) => {

	await bot.updateConfig(member.guild.id)
	
	var metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (bot.WANT_CUSTOM_LOGS && bot.guildMemberRemove) new bot.logSystem(metadata).record()
}