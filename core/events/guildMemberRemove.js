const formatManager = require(`../utils/formatManager`)

module.exports = (bot,member) => {
	// "I've tweaked the interface for server stats. -naphnaphz / 12.01.18"
	let members = member.guild.memberCount
	let botSize = member.guild.members.filter(a => a.user.bot).size
	let userSize = members - botSize
	const configFormat = new formatManager()

	let memberCountUpdate = bot.channels.get(`518245560239652867`)
	memberCountUpdate.setName(`˗ˏˋ ${configFormat.threeDigitsComa(userSize)} Artists!! ˎˊ˗`)

	let DELETEDATA = false
	DELETEDATA == true ? removeDataOnLeave() : null
	function removeDataOnLeave(){
		bot.db._query(`DELETE FROM clanmember WHERE userId = ?`, `run`, [member.id])
		bot.db._query(`DELETE FROM userdata WHERE userId = ?`, `run`, [member.id])
		bot.db._query(`DELETE FROM usercheck WHERE userId = ?`, `run`, [member.id])
		bot.db._query(`DELETE FROM userbadges WHERE userId = ?`, `run`, [member.id])
		bot.db._query(`DELETE FROM userartworks WHERE userId = ?`, `run`, [member.id])
		bot.db._query(`DELETE FROM relationship WHERE userId1 = ? OR userId2 = ?`, `run`, [member.id, member.id])
		bot.db._query(`DELETE FROM item_inventory WHERE user_id = ?`, `run`, [member.id])
	}
}