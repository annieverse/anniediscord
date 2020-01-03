const Routines = require(`../utils/Routines`)
module.exports = bot => {


	const { env, logger } = bot
	const Routine = new Routines(bot)


	if (env.dev) {


		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */

		if (env.WELCOMER_TEST) {
			const BannerTest = require(`../utils/welcomeBannerUI`)
			new BannerTest({bot, member:require(`../../test/testmsg`), channel:`654401864565129236`}).render()
		}

		logger.info(`${bot.user.username} up in dev environment. (${bot.getBenchmark(process.hrtime(bot.startupInit))})`)
		bot.user.setStatus(`dnd`)
		bot.user.setActivity(`maintenance.`, {
			type: `LISTENING`
		})


	} else {


		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		logger.info(`${bot.user.username} up in production. (${bot.getBenchmark(process.hrtime(bot.startupInit))})`)
		bot.user.setStatus(`online`)
		bot.user.setActivity(null)
		

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
		//	Check if pixiv cache's dir exists or not.
		Routine.pixivCacheDirCheck()


		/**
		 * 	--------------------------------------------------
		 * 	Below are features that currently binding to AAU guild.
		 * 	Can be disabled or adjusted for cross-server proposal.
		 * 	--------------------------------------------------
		 */

		//	Change Booster Role color
		Routine.roleChange()
		//	Automatically change bot status
		Routine.autoStatus()
		// Remove featured daily post
		Routine.removeFeaturedDailyPostLoop()
	}

}
