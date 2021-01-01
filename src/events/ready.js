const Routines = require(`../libs/routines`)
const commanifier = require(`../utils/commanifier`)
const VotesManager = require(`../libs/votes`)
module.exports = annie => {
	const { dev, logger, prefix } = annie
	const Routine = new Routines(annie)
	//  Run configurations once
	if (annie.startupState) {
		annie.startupState = 0
		annie.registerGuildConfigurations()
		annie.registerReminders()
		annie.registerGuildAutoResponders()
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
		setInterval(() => {
			annie.user.setActivity(
				[
					`${commanifier(annie.guilds.cache.reduce((a, g) => a + g.memberCount, 0))} users`,
					`${prefix}help`
				][Math.floor(Math.random() * 2)],
				{type: `WATCHING`}
			)
		//  Refresh activity for every 60 seconds
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
	}
}
