const Routines = require(`../libs/routines`)
const commanifier = require(`../utils/commanifier`)
const VotesManager = require(`../libs/votes`)
module.exports = annie => {
	const { dev, logger, prefix } = annie
	const Routine = new Routines(annie)
	//  Run guild configurations once
	if (annie.startupState) {
		annie.startupState = 0
		annie.registerGuildConfigurations()
	}
	if (dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
		logger.info(`${annie.user.username}@${annie.user.id} has been deployed (${annie.getBenchmark(annie.startupInit)})`)
		logger.info(`currently serving in ${annie.guilds.cache.size} guilds and ${annie.users.cache.size} users`)
		annie.user.setStatus(`dnd`)
	} else {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		logger.info(`Successfully logged in. (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		logger.info(`currently serving in ${annie.guilds.cache.size} guilds and ${annie.users.size} users`)
		annie.user.setStatus(`online`)
		const availablePresences = [`${commanifier(annie.guilds.cache.reduce((a, g) => a + g.memberCount, 0))} users`, `${prefix}help`]
		const presenceRefresh = (data) => annie.user.setActivity(data, {type: `WATCHING`})
		presenceRefresh(availablePresences[1])
		setInterval(() => {
			presenceRefresh(availablePresences[Math.floor(Math.random() * availablePresences.length)])
		//  Refresh activity for every 1 minute
		}, 60000)
		/**
		 * 	--------------------------------------------------
		 * 	Primary task
		 * 	--------------------------------------------------
		 */
		//	Recording resource usage every 5 mins
		Routine.resourceUsageLogging()
		//	Check if pixiv cache's dir exists or not
		Routine.pixivCacheDirCheck()
		//	Release pixiv caches every 30 minutes
		Routine.releasePixivCaches()
		//  Handling incoming votes
		new VotesManager(annie)
		/**
		 * 	--------------------------------------------------
		 * 	Below are features that currently binding to AAU guild.
		 * 	Can be disabled or adjusted for cross-server proposal.
		 * 	--------------------------------------------------
		 */

		//	Change Booster Role color
		Routine.roleChange()
		// Remove featured daily post
		Routine.removeFeaturedDailyPostLoop()
	}

}
