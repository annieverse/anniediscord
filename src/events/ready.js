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
		//Routine.autoStatus()
		// Remove featured daily post
		Routine.removeFeaturedDailyPostLoop()
	}
	
	/**
	 *	--------------------------------------------------
	 *	Require more test prior the capability of adding multi-guild data support.
	 *  Refer to: v6.1.0 Crash & Data Lost #235 by BaitGod01
	 *  --------------------------------------------------
	 */
	async function updates() {
		await fillGuildsOfTables() // fills guild ids of the tables it can
		await makeGuildIdPKuser_relationships() // makes table have guild_id pk
		await FillGuildIdsOfuser_dailiesAnduser_reputations() // fills rest of guild_ids once all tables have pk
	}

	async function FillGuildIdsOfuser_dailiesAnduser_reputations() {	
		// for user_dailies
		// unique, has pk
		await annie.db._query(`UPDATE OR REPLACE user_dailies SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
		await annie.db._query(`UPDATE OR REPLACE user_reputations SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
	}

	async function makeGuildIdPKuser_relationships() {
		await annie.db._query(`PRAGMA foreign_keys = OFF`,`run`)
		await annie.db._query(`BEGIN TRANSACTION`,`run`)
		await annie.db._query(`CREATE TABLE "user_relationships2" (
			"registered_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"updated_at"	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			"user_id_A"	TEXT,
			"user_id_B"	TEXT,
			"relationship_id"	TEXT,
			"guild_id"	TEXT,
			FOREIGN KEY("user_id_A") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
			FOREIGN KEY("user_id_B") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
			FOREIGN KEY("relationship_id") REFERENCES "relationships"("relationship_id") ON DELETE CASCADE ON UPDATE CASCADE,
			PRIMARY KEY("user_id_A","user_id_B","guild_id")
		)`,`run`
		)
		await annie.db._query(`INSERT INTO user_relationships2(registered_at, updated_at, user_id_A, user_id_B, relationship_id, guild_id)
		SELECT registered_at, updated_at, user_id_A, user_id_B, relationship_id, guild_id
		FROM user_relationships`,`run`)
		await annie.db._query(`DROP TABLE user_relationships`,`run`)
		await annie.db._query(`ALTER TABLE user_relationships2 RENAME TO user_relationships`,`run`)
		
		await annie.db._query(`PRAGMA foreign_keys = ON`,`run`)
		
		await annie.db._query(`COMMIT TRANSACTION`,`run`)
		
		return logger.info(`guild col added to user_relationships`)
	}

	async function fillGuildsOfTables() {
		// for user_exp
		// has PK
		await annie.db._query(`UPDATE user_exp SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
		// for user_inventories
		// has PK
		await annie.db._query(`UPDATE user_inventories SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
		// for user_relationships
		// does not have PK
		await annie.db._query(`UPDATE user_relationships SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
	}
	// for user_dailies
	// unique, has pk
	//await annie.db._query(`UPDATE user_dailies SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
	// for user_reputations
	// unique, has pk
	//await annie.db._query(`UPDATE user_reputations SET guild_id = ? WHERE guild_id IS NULL`,`run`,[`459891664182312980`])
}
