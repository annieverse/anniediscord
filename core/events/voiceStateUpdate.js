const database = require(`../utils/databaseManager`)
const experience = require(`../utils/ExperienceFormula`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)

module.exports = (bot, oldMember, newMember) => {

	//	Get keyv and logger from @Client
	const { keyv, logger } = bot

	// Set the minimum amount of time needed to recieve xp
	let minimumTime = 30 //amount of minutes

	// Grabs the channel object and assigns them to a varible
	let newMemberChannel = newMember.voiceChannel
	let oldMemberChannel = oldMember.voiceChannel

	// db connection
	let db = new database(newMember.user.id)

	// grabs a afk channel if one exists, if not do nothing (No exp for being in vc)
	let afkChannel = bot.channels.get(bot.guilds.get(newMember.guild.id).afkChannelID)
	if (!afkChannel) return logger.warn(`There is no afk channel so, I cannot give xp to those in vc currently until I learn how to do so :)`)

	// Checks to make sure the user is not a bot
	if (oldMember.user.bot || newMember.user.bot) return

	/**
     * for when a user joins a VC
     * @joinVC
     */
	async function joinVC() { if (newMemberChannel.id !== afkChannel.id) return keyv.set(newMember.user.id, new Date()) }

	/**
     * for when a user leaves a VC
     * @leaveVC
     */
	async function leaveVC() {
		if (oldMemberChannel.id !== afkChannel.id) {

			let TimeJoined = new Date(await keyv.get(oldMember.user.id))
			let currentTime = new Date()

			// Find the distance between now and the count down date
			var distance = currentTime.getTime() - TimeJoined.getTime()

			// For Total amount of minutes
			var totalMinutes = Math.floor(distance / (1000 * 60))
			// Tests to see if the user has been in for atleast 30 minutes (the coolDown time)(minimumTime)
			if (totalMinutes < minimumTime) return keyv.delete(oldMember.user.id)

			//Keep below for future
			// Time calculations for days, hours, minutes and seconds
			//var days = Math.floor(distance / (1000 * 60 * 60 * 24));
			//var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			//var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			//var seconds = Math.floor((distance % (1000 * 60)) / 1000);

			//  pull userdata 
			let data = await db.userMetadata()
			// Metadata that gonna be passed to Experience Class parameters
			// These are default values. Tweak on your choice.
			let metadata = {
				applyTicketBuffs: true,
				applyCardBuffs: true,
                
				bonus: 1,
				bot: bot,
				meta: {
					author: oldMember.user,
					data: data
				},
				user: data,
				message: {
					author: oldMember.user,
					guild: oldMember.guild,
					channel: oldMemberChannel,
					member: oldMember
				},
				total_gained_exp: Math.floor(totalMinutes/2),
				updated: {
					currentexp: 0,
					level: 0,
					maxexp: 0,
					nextexpcurve: 0
				}
			}

			// Store the exp
			await new experience(metadata).runAndUpdate()

			// Delete from record when the transaction is over
			keyv.delete(oldMember.user.id)
		}
	}

	/**
     * For when a user changes/switches VC channels
     * @changeVC
     */
	async function changeVC() { if (newMemberChannel.id === afkChannel.id) { leaveVC() } else if ((newMemberChannel.id === afkChannel.id) && (oldMemberChannel.id !== afkChannel.id)) { joinVC() } }


	// execute joining vc
	let isJoin = !oldMemberChannel && newMemberChannel
	if (isJoin) return joinVC()

	// execute leaving vc
	let isLeave = oldMemberChannel && !newMemberChannel
	if (isLeave) return leaveVC()

	// switching vc
	let isSwitch = (oldMemberChannel.id != newMemberChannel.id) || (newMemberChannel.id != oldMemberChannel.id)
	if (isSwitch) return changeVC()

}