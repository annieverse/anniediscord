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
		annie.dbl.postStats(annie.guilds.cache.size)
		annie.dbl.webhook.on('vote', vote => {
			annie.logger.info(`USER_ID: ${vote.user} just voted!`)
			annie.db.updateInventory({itemId: 52, userId: vote.user, value: 3000})
			const user = annie.users.cache.get(vote.user)
			user.send(`**Thanks for the voting, ${user.user.username}!** I've sent ${annie.emojis.find(node => node.name === `artcoins`)}**3,000** to your inventory as the reward!
				You can check it by typing \`${prefix}bal\` or \`${prefix}inventory\``)
		})
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
