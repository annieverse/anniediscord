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
		updates()
		
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
	
	async function updates() {
		await updateTable()
		await fixDefault()
		await alterTables()
		await addGuildIdColTo_user_dailies()
		await addGuildIdColTo_user_exp()
		await addGuildIdColTo_user_reputations()
		await addGuildIdColTo_user_inventories()
	}

	async function addGuildIdColTo_user_inventories(){
		await annie.db._query(`BEGIN TRANSACTION`,`run`)

		await annie.db._query(`CREATE TABLE "users2" (
			"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"updated_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id"	TEXT,
			"item_id"	INTEGER,
			"quantity"	INTEGER DEFAULT 0,
			"in_use"	INTEGER DEFAULT 0,
			"guild_id"	TEXT,
			FOREIGN KEY("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE CASCADE,
			FOREIGN KEY("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
			PRIMARY KEY("user_id","item_id","guild_id")
		)`,`run`
		)
		await annie.db._query(`INSERT INTO users2(registered_at, updated_at, user_id, item_id, quantity, in_use, guild_id)
		SELECT registered_at, updated_at, user_id, item_id, quantity, in_use, guild_id
		FROM user_inventories`,`run`)

		await annie.db._query(`DROP TABLE user_inventories`,`run`)

		await annie.db._query(`ALTER TABLE users2 RENAME TO user_inventories`,`run`)

		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`guild col added to user_inventories`)
	}

	async function addGuildIdColTo_user_reputations(){
		await annie.db._query(`BEGIN TRANSACTION`,`run`)

		await annie.db._query(`CREATE TABLE "users2" (
			"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"last_giving_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"last_received_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id"	TEXT,
			"total_reps" INTEGER DEFAULT 0,
			"recently_received_by" TEXT,
			"guild_id" TEXT,
			PRIMARY KEY("user_id", "guild_id"),
			FOREIGN KEY("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
		)`,`run`
		)
		await annie.db._query(`INSERT INTO users2(registered_at, last_giving_at, last_received_at, user_id, total_reps, recently_received_by, guild_id)
		SELECT registered_at, last_giving_at, last_received_at, user_id, total_reps, recently_received_by, guild_id
		FROM user_reputations`,`run`)

		await annie.db._query(`DROP TABLE user_reputations`,`run`)

		await annie.db._query(`ALTER TABLE users2 RENAME TO user_reputations`,`run`)

		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`guild col added to user_reputations`)
	}

	async function addGuildIdColTo_user_exp(){
		
		await annie.db._query(`BEGIN TRANSACTION`,`run`)

		await annie.db._query(`CREATE TABLE "users2" (
			"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"updated_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id"	TEXT,
			"current_exp"	INTEGER DEFAULT 0,
			"booster_id"	INTEGER,
			"booster_activated_at"	TIMESTAMP,
			"guild_id"	TEXT,
			FOREIGN KEY("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
			FOREIGN KEY("booster_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE CASCADE,
			PRIMARY KEY("user_id","guild_id")
		)`,`run`
		)

		await annie.db._query(`INSERT INTO users2(registered_at, updated_at, user_id, current_exp, booster_id, booster_activated_at, guild_id)
		SELECT registered_at, updated_at, user_id, current_exp, booster_id, booster_activated_at, guild_id
		FROM user_exp`,`run`)

		await annie.db._query(`DROP TABLE user_exp`,`run`)

		await annie.db._query(`ALTER TABLE users2 RENAME TO user_exp`,`run`)

		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`guild col added to user_exp`)
	}

	async function addGuildIdColTo_user_dailies(){
		
		await annie.db._query(`BEGIN TRANSACTION`,`run`)

		await annie.db._query(`CREATE TABLE "users2" (
			"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"updated_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id"	TEXT,
			"total_streak"	INTEGER DEFAULT 0,
			"guild_id"	TEXT,
			FOREIGN KEY("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
			PRIMARY KEY("user_id","guild_id")
		)`,`run`
		)

		await annie.db._query(`INSERT INTO users2(registered_at, updated_at, total_streak, guild_id)
		SELECT registered_at, updated_at, total_streak, guild_id
		FROM user_dailies`,`run`)

		await annie.db._query(`DROP TABLE user_dailies`,`run`)

		await annie.db._query(`ALTER TABLE users2 RENAME TO user_dailies`,`run`)

		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`guild col added to user_dailies`)
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

		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`Default value fixed`)
	}



	async function alterTables() {
		// for user_exp
		let bool = true
		let res = await annie.db._query(`PRAGMA table_info(user_exp)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for user_exp`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE user_exp ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE user_exp SET guild_id = ?`,`run`,[`459891664182312980`])
		}
		bool = true
		// for user_inventories
		res = await annie.db._query(`PRAGMA table_info(user_inventories)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for user_inventories`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE user_inventories ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE user_inventories SET guild_id = ?`,`run`,[`459891664182312980`])
		}
		bool = true
		// for user_dailies
		res = await annie.db._query(`PRAGMA table_info(user_dailies)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for user_dailies`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE user_dailies ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE user_dailies SET guild_id = ?`,`run`,[`459891664182312980`])
		}
		bool = true
		// for user_reputations
		res = await annie.db._query(`PRAGMA table_info(user_reputations)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for user_reputations`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE user_reputations ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE user_reputations SET guild_id = ?`,`run`,[`459891664182312980`])
		}
		bool = true
		// for user_relationships
		res = await annie.db._query(`PRAGMA table_info(user_relationships)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for user_relationships`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE user_relationships ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE user_relationships SET guild_id = ?`,`run`,[`459891664182312980`])
		}
		bool = true
		res = await annie.db._query(`PRAGMA table_info(userdata)`,`all`)
		for (let index = 0; index < res.length; index++) {
			const element = res[index]
			if (element.name == `guild_id`){
				bool = false
				logger.info(`Column already added for userdata`)
				break
			}
		}
		if (bool) {
			await annie.db._query(`ALTER TABLE userdata ADD COLUMN guild_id TEXT`,`run`)
			await annie.db._query(`UPDATE userdata SET guild_id = ?`,`run`,[`459891664182312980`])
		}
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
