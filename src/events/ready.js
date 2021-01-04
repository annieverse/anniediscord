const commanifier = require(`../utils/commanifier`)
const VotesManager = require(`../libs/votes`)
module.exports = annie => {
	//  Run configurations once
	if (annie.startupState) {
		annie.startupState = false
		annie.registerGuildConfigurations()
		annie.registerReminders()
		annie.registerGuildAutoResponders()
	}
	if (annie.dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
		annie.logger.info(`${annie.user.username}@${annie.user.id} has been deployed (${annie.getBenchmark(annie.startupInit)})`)
		annie.logger.info(`currently serving in ${annie.guilds.cache.size} guilds and ${annie.users.cache.size} users`)
		annie.user.setStatus(`dnd`)
	} else {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		annie.logger.info(`Successfully logged in. (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		annie.logger.info(`currently serving in ${annie.guilds.cache.size} guilds and ${annie.users.size} users`)
		annie.user.setStatus(`online`)
		const presencePools = [`${commanifier(annie.guilds.cache.reduce((a, g) => a + g.memberCount, 0))} users`, `${annie.prefix}help`]
		setInterval(() => {
			annie.user.setActivity(presencePools[Math.floor(Math.random() * presencePools.length)], {type: `WATCHING`})
		//  Refresh activity for every 60 seconds
		}, 60000)
		/**
		 * 	--------------------------------------------------
		 * 	Primary task
		 * 	--------------------------------------------------
		 */
		//	Recording resource usage every 5 mins
		annie.routines.resourceUsageLogging()
		//	Check if pixiv cache's dir exists or not
		annie.routines.pixivCacheDirCheck()
		//	Release pixiv caches every 30 minutes
		annie.routines.releasePixivCaches()
		//  Handling incoming votes
		new VotesManager(annie)
	}
}
