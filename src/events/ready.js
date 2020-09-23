const Routines = require(`../libs/routines`)
const commanifier = require(`../utils/commanifier`)
const VotesManager = require(`../libs/votes`)
module.exports = annie => {
	const { dev, logger, prefix } = annie
	const Routine = new Routines(annie)
	new VotesManager(annie)
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
		annie.user.setActivity(`${commanifier(annie.users.cache.size)} users | ${prefix}help`, {type: `WATCHING`})
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
