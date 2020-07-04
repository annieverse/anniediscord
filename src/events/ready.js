const Routines = require(`../libs/routines`)
module.exports = annie => {


	const { dev, logger } = annie
	const Routine = new Routines(annie)


	if (dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
		logger.info(`${annie.user.username}@${annie.user.id} has been deployed (${annie.getBenchmark(annie.startupInit)})`)
		logger.info(`currently serving in ${annie.guilds.size} guilds and ${annie.users.size} users`)
		annie.user.setStatus(`dnd`)
		updateTable()
		async function updateTable(){
			let tableInfo = await annie.db._query(`PRAGMA table_info(guild_configurations)`,`all`)
			for (let index = 0; index < tableInfo.length; index++) {
				const element = tableInfo[index];
				if (element.name == `customized_parameter`) return
				if (element.name == `channel_id`){
					await annie.db._query(`ALTER TABLE guild_configurations RENAME COLUMN channel_id TO customized_parameter`,`run`)
					let test = await annie.db._query(`SELECT customized_parameter FROM guild_configurations`,`get`)
					logger.info(`TEST: ${test.customized_parameter}`)
				}
			}
		}
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
