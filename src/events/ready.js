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
		fixDefault()
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

		// Can be deleted after
		updateTable()
		fixDefault()


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

	async function fixDefault(){

		let res = await annie.db._query(`PRAGMA table_info(users)`,`all`)

		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.dflt_value == `'Hi! I''m a new user!'`){
				return logger.info(`Default value already fixed`)
			}
		}

		await annie.db._query(`BEGIN TRANSACTION`,`run`)

		await annie.db._query(`CREATE TABLE IF NOT EXISTS users2( 
		"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"updated_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"last_login_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id"	TEXT,
			"name"	REAL,
			"bio"	TEXT DEFAULT 'Hi! I''m a new user!',
			"verified"	INTEGER DEFAULT 0,
			"lang"	TEXT DEFAULT 'en',
			"receive_notification"	INTEGER DEFAULT -1,
			PRIMARY KEY("user_id")
			)`,`run`
		)

		await annie.db._query(`INSERT INTO users2(registered_at, updated_at,last_login_at, user_id, name, bio, verified, lang, receive_notification)
		SELECT registered_at, updated_at,last_login_at, user_id, name, bio, verified, lang, receive_notification
		FROM users`,`run`)

		await annie.db._query(`DROP TABLE users`,`run`)

		await annie.db._query(`ALTER TABLE users2 RENAME TO users`,`run`)

		await annie.db._query(`COMMIT`,`run`)
		
		return logger.info(`Default value fixed`)
	}
	
	async function updateTable(){
		let tableInfo = await annie.db._query(`PRAGMA table_info(guild_configurations)`,`all`)
		for (let index = 0; index < tableInfo.length; index++) {
			const element = tableInfo[index]
			if (element.name == `customized_parameter`) return
			if (element.name == `channel_id`){
				await annie.db._query(`ALTER TABLE guild_configurations RENAME COLUMN channel_id TO customized_parameter`,`run`)
				let test = await annie.db._query(`SELECT customized_parameter FROM guild_configurations`,`get`)
				logger.info(`TEST: ${test.customized_parameter}`)
			}
		}
	}
}
