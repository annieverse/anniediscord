const { absence_ticket } = require(`../utils/role-list`)


module.exports = (bot,member) => {

	userLeaving()

	async function userLeaving() {
		let shouldDeleteData = true // master deletion switch

		// if absence_ticket isn't given a value, don't allow user data deletion
		if (absence_ticket == ``) shouldDeleteData = false

		// if deletion of user data is false, don't procced
		if(shouldDeleteData) return

		// test if the user had the absence ticket
		let hasAbsenceTicket = member.roles.has(absence_ticket)

		// if user has an absenceTicket, don't procced
		if (hasAbsenceTicket) return

		// retrieve user's leave count
		let usercheck = await bot.db._query(`SELECT leavepenalty FROM usercheck WHERE userId = ?`, `get`, [member.id])

		// set leave count to var for readability
		let leavepenaltycount = usercheck.leavepenalty

		switch (leavepenaltycount) {
			case 3: // amount needed before deletion
				//removeUserData()
				break
			default: // do this if amount needed for deletion isn't reached
				bot.db._query(`UPDATE usercheck SET leavepenalty = leavepenalty + 1 WHERE userId = ?`, `get`, [member.id])
				break
		}

		async function removeUserData() {

			// Do after the x time leaving

			// data is earsed
			bot.db._query(`DELETE FROM userartworks WHERE userId = ?`, `run`, [member.id])
			bot.db._query(`DELETE FROM clanmember WHERE userId = ?`, `run`, [member.id])
			bot.db._query(`DELETE FROM relationship WHERE userId1 = ? OR userId2 = ?`, `run`, [member.id, member.id])
			bot.db._query(`DELETE FROM usercheck WHERE userId = ?`, `run`, [member.id])
			bot.db._query(`DELETE FROM userbadges WHERE userId = ?`, `run`, [member.id])

			// Partial data remains
			let userLevelData = await bot.db._query(`SELECT currentexp FROM userdata WHERE userId = ?`, `get`, [member.id])
			let levelData = await bot.db.xpFormula(userLevelData.currentexp)
			let level = levelData.level

			// set level to level 25 if user had a level over 65, other wise set level to 10
			if (level >= 65) {
				let xpForLevelTwentyFive = (await bot.db.xpFormula(25)).exp
				bot.db._query(`UPDATE userdata SET currentexp = ? WHERE userId = ?`, `run`, [xpForLevelTwentyFive, member.id])
			} else {
				let xpForLevelTen = (await bot.db.xpFormula(10)).exp
				bot.db._query(`UPDATE userdata SET currentexp = ? WHERE userId = ?`, `run`, [xpForLevelTen, member.id])
			}

			// Delete all inventory data and subtract half their balance
			bot.db._query(`DELETE FROM item_inventory WHERE user_id = ? and item_id != ?`, `run`, [member.id, 52])
			bot.db._query(`UPDATE item_inventory SET quantity = round(quantity/2) WHERE user_id = ? and item_id != ?`, `run`, [member.id, 52])
		}
	}
	var metadata = {
		member: member,
		guild: member.guild,
		typeOfLog: `guildMemberRemove`,
		bot: bot
	}
	if (bot.WANT_CUSTOM_LOGS && bot.guildMemberRemove) new bot.logSystem(metadata).record()
}