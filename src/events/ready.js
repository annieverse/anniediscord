const Routines = require(`../utils/Routines`)
module.exports = annie => {


	const { config, logger } = annie
	const Routine = new Routines(annie)


	if (config.dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
		logger.info(`${annie.user.username}@${annie.user.id} has been deployed (${annie.benchmark(annie.startupInit)})`)
		logger.info(`currently serving in ${annie.guilds.size} guilds and ${annie.users.size} users`)
		annie.user.setStatus(`dnd`)
	} else {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		logger.info(`Successfully logged in. (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		logger.info(`currently serving in ${annie.guilds.size} guilds and ${annie.users.size} users`)
		annie.user.setStatus(`online`)
		/**
		 * 	--------------------------------------------------
		 * 	Primary task
		 * 	--------------------------------------------------
		 */

		//	Scheduling for database backup
		Routine.databaseBackup()
		//	Schema/tables check
		Routine.databaseCheck()
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
		//	Automatically change annie status
		Routine.autoStatus()
		// Remove featured daily post
		Routine.removeFeaturedDailyPostLoop()
	}
}
