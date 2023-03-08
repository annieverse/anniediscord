const SqliteClient = require(`better-sqlite3`)
const Redis = require(`async-redis`)
const logger = require(`pino`)({ name: `DATABASE`, level: `debug` })
const getBenchmark = require(`../utils/getBenchmark`)
const fs = require(`fs`)
const { join } = require(`path`)

/**
 * Centralized Class for handling various database tasks 
 * for Annie.
 */
class Database {
	/**
	 * @param {Client} client sql instance that is going to be used
	 */
	constructor(client = {}) {
		this.client = client
	}
	/**
	 * Opening database connection
	 * @param {string} [path=`.data/database.sqlite`]
	 * @param {string} [fsPath=`../../.data/database.sqlite`]
	 * @returns {this}
	 */
	connect(path = `.data/database.sqlite`, fsPath = `../../.data/database.sqlite`) {
		/**
		 * This will check if the db file exists or not.
		 * If file is not found, throw an error.
		 */
		fs.accessSync(join(__dirname, fsPath), fs.constants.F_OK)
		this.client = new SqliteClient(path, { timeout: 10000 })
		this.client.pragma(`journal_mode = WAL`)
		this.client.pragma(`synchronous = FULL`)
		logger.info(`SQLITE <CONNECTED>`)
		//  Refresh wal checkpoint if exceeds the threeshold once very 30 seconds.
		setInterval(fs.stat.bind(null, path, (err, stat) => {
			if (err) {
				if (err.code !== `ENOENT`) throw err
				// 1e+8 equals to 100 megabytes. 
			}
			if (stat.size > 2e+9) {
				this.client.pragma(`wal_checkpoint(RESTART)`)
			}
		}), 5000).unref()
		this.connectRedis()
		return this
	}

	initializeDb() {
		this.databaseUtility = new DatabaseUtility(this)
		this.quests = new Quests(this)
		this.reminders = new Reminders(this)
		this.guildUtility = new GuildUtility(this)
		this.autoResponder = new AutoResponder(this)
		this.durationalBuffs = new DurationalBuffs(this)
		this.userUtility = new UserUtility(this)
		this.systemUtility = new SystemUtility(this)
		this.customRewards = new CustomRewards(this)
		this.shop = new Shop(this)
		this.covers = new Covers(this)
		this.relationships = new Relationships(this)
	}

	/**
	 * Opening redis database connection
	 * @return {void}
	 */
	async connectRedis() {
		const redisClient = await Redis.createClient()
		redisClient.on(`error`, err => {
			logger.error(`REDIS <ERROR> ${err.message}`)
			process.exit()
		})
		redisClient.on(`connect`, async () => {
			logger.info(`REDIS <CONNECTED>`)
			this.redis = redisClient
		})
	}
}

class DatabaseUtility {
	constructor(obj) {
		this.client = obj.client
		this.redis = obj.redis
		this.fnClass = `DatabaseUtility`
	}

	/**
	 * 	Standardized method for executing sql query
	 * 	@param {string} [stmt=``] sql statement
	 * 	@param {string} [type=`get`] `get` for single result, `all` for multiple result
	 * 	and `run` to execute statement such as UPDATE/INSERT/CREATE.
	 * 	@param {array} [supplies=[]] parameters to be supplied into sql statement.
	 *  @private
	 *  @returns {QueryResult|null}
	 */
	async _query(stmt = ``, type = `get`, supplies = [], log) {
		//	Return if no statement has found
		if (!stmt) return null
		const que = this.client.prepare(stmt)
		const fn = this.client.transaction(params => que[type](params))
		const result = await fn(supplies)
		if (!result) return null
		if (log) logger.info(log)
		return result
	}


	/**
	 * Check if cache exist in redis or not.
	 * @param {string} [key=``] Target cache's key.
	 * @return {boolean}
	 */
	async isCacheExist(key = ``) {
		const cache = await this.redis.get(key)
		return cache !== null ? true : false
	}

	/**
	 * Retrieve cache.
	 * @param {string} [key=``] Target cache's key.
	 * @return {string|null}
	 */
	getCache(key = ``) {
		return this.redis.get(key)
	}

	/**
	 * Register cache.
	 * @param {string} [key=``] Target cache's key.
	 * @param {string} [value=``] The content to be filled in.
	 * @return {boolean}
	 */
	setCache(key = ``, value = ``) {
		return this.redis.set(key, value)
	}

	/**
	 * Clearing out cache.
	 * @param {string} [key=``] Target cache's key.
	 * @return {boolean}
	 */
	clearCache(key = ``) {
		logger.info(`[Redis.clearCache] cleared cache in key '${key}'.`)
		return this.redis.del(key)
	}

	/**
	 * Format a log to describe where the function is ran from
	 * @param {String} fn 
	 * @returns {String}
	 */
	formatFunctionLog(fn) {
		return `[${this.fnClass}.${fn}()]`
	}

	/**
	 * Register a user into user-tree tables if doesn't exist.
	 * @param {string} [userId=``] User's discord id.
	 * @param {string} [userName=``] User's username. Purposely used when fail to fetch user by id.
	 * @returns {void}
	 */
	async validateUserEntry(userId = ``, userName = ``) {
		const fn = this.formatFunctionLog(`validateUserEntry`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!userName) throw new TypeError(`${fn} parameter "userName" cannot be blank.`)
		//  Check on cache
		const key = `VALIDATED_USERID`
		const onCache = await this.redis.sismember(key, userId)
		//  if true/registered, skip database hit.
		if (onCache) return
		const res = await this._query(`
            INSERT INTO users(user_id, name)
            SELECT $userId, $userName
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`
			, `run`
			, { userId: userId, userName: userName }
			, `${fn} Validating user ${userName}(${userId})`
		)
		if (res.changes) logger.info(`USER_ID:${userId} registered`)
		this.redis.sadd(key, userId)
	}

	/**
	 * Standardized method for making changes to the user_inventories
	 * @param {itemsMetadata} meta item's metadata
	 * @returns {boolean}
	 */
	async updateInventory({ itemId, value = 0, operation = `+`, distributeMultiAccounts = false, userId, guildId }) {
		const fn = this.formatFunctionLog(`updateInventory`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!guildId && !distributeMultiAccounts) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (operation != `+` && operation != `-`) throw new RangeError(`${fn} parameter "operation" can only be "+" or "-"`)
		let res
		if (distributeMultiAccounts) {
			res = {
				//	Insert if no data entry exists.
				insert: await this._query(`
					INSERT INTO user_inventories (item_id, user_id)
					SELECT $itemId, $userId
					WHERE NOT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = $itemId AND user_id = $userId)
                    AND EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`
					, `run`
					, { itemId: itemId, userId: userId }
					, `${fn} Making sure user record exists`
				),
				//	Try to update available row. It won't crash if no row is found.
				update: await this._query(`
					UPDATE user_inventories
					SET 
						quantity = quantity ${operation} $value,
						updated_at = datetime('now')
					WHERE item_id = $itemId AND user_id = $userId`
					, `run`
					, { value: value, itemId: itemId, userId: userId }
					, `${fn} Updating user's inventory`
				)
			}
		}
		else {
			res = {
				//	Insert if no data entry exists.
				insert: await this._query(`
					INSERT INTO user_inventories (item_id, user_id, guild_id)
					SELECT $itemId, $userId, $guildId
					WHERE NOT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = $itemId AND user_id = $userId AND guild_id = $guildId)
                    AND EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`
					, `run`
					, { itemId: itemId, userId: userId, guildId: guildId }
					, `${fn} Making sure user record exists`
				),
				//	Try to update available row. It won't crash if no row is found.
				update: await this._query(`
					UPDATE user_inventories
					SET 
						quantity = quantity ${operation} $value,
						updated_at = datetime('now')
						WHERE item_id = $itemId AND user_id = $userId AND guild_id = $guildId`
					, `run`
					, { value: value, itemId: itemId, userId: userId, guildId: guildId }
					, `${fn} Updating user's inventory`
				)
			}
		}

		const type = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${type}(${distributeMultiAccounts ? `distributeMultiAccounts` : ``})(${operation}) (ITEM_ID:${itemId})(QTY:${value}) | USER_ID ${userId}`)
		return true
	}

	/**
	* Pull ID ranking based on given descendant column order.
	* @param {string} [group] of target category
	* @param {string} [guildId] of target guild
	* @returns {QueryResult}
	*/
	async indexRanking(group, guildId) {
		const fn = this.formatFunctionLog(`indexRanking`)
		const validOptions = [`exp`, `artcoins`, `fame`]
		if (!group) throw new TypeError(`${fn} parameter "group" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!validOptions.includes(group)) throw new RangeError(`${fn} parameter "group" is not a valid option`)
		switch (group) {
			case `exp`:
				return this._query(`
			SELECT 
				user_id AS id, 
				current_exp AS points 
			FROM user_exp 
			WHERE guild_id = $guildId
			ORDER BY current_exp DESC`
					, `all`
					, { guildId: guildId }
					, `${fn} Fetching ${group} leaderboard`
				)
			case `artcoins`:
				return this._query(`
			SELECT 
				user_id AS id, 
				quantity AS points 
			FROM user_inventories 
			WHERE item_id = 52 
				AND guild_id = $guildId
			ORDER BY quantity DESC`
					, `all`
					, { guildId: guildId }
					, `${fn} Fetching ${group} leaderboard`
				)
			case `fame`:
				return this._query(`
			SELECT 
				user_id AS id, 
				total_reps AS points 
			FROM user_reputations 
			WHERE guild_id = $guildId
			ORDER BY total_reps DESC`
					, `all`
					, { guildId: guildId }
					, `${fn} Fetching ${group} leaderboard`
				)
			default:
				break
		}
	}
}

class Reminders extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `Reminders`
	}

	/**
	 * Fetch all registered user's reminders
	 * @return {array}
	 */
	getAllReminders() {
		const fn = this.formatFunctionLog(`getAllReminders`)
		return this._query(`
			SELECT * 
			FROM user_reminders`
			, `all`
			, []
			, `${fn} getting all reminders`
		)
	}

	/**
	 * Registering a new reminder
	 * @param {object}
	 * @return {QueryResult}
	 */
	registerUserReminder(context) {
		function arrayEquals(a, b) {
			return Array.isArray(a) &&
				Array.isArray(b) &&
				a.length === b.length &&
				a.every((val, index) => val === b[index])
		}
		const validKeys = [
			`registeredAt`,
			`id`,
			`userId`,
			`message`,
			`remindAt`,
			`isValidReminder`
		  ]
		if (!context) new TypeError(`${fn} parameter "context" cannot be blank.`)
		if (typeof(context) === `object` && arrayEquals(Object.keys(context),validKeys)) new TypeError(`${fn} parameter "context" must be a object and include the following: registeredAt, id, userId, message, and remindAt.`)
		const fn = this.formatFunctionLog(`registerUserReminder`)
		return this._query(`
			INSERT INTO user_reminders(
				registered_at,
				reminder_id,
				user_id,
				message,
				remind_at
			)
			VALUES($registeredAt, $reminderId, $userId, $message, $remindAt)`
			, `run`
			, {registeredAt:context.registeredAt.toString(),reminderId:context.id,userId:context.userId,message:context.message,remindAt:JSON.stringify(context.remindAt)}
			, `${fn} Inserting new reminder for user (${context.userId})`
		)
	}

	/**
	 * Fetch registered user's reminders
	 * @param {string} userId
	 * @return {array}
	 */
	getUserReminders(userId) {
		if (!userId) new TypeError(`${fn} parameter "userId" cannot be blank.`)
		const fn = this.formatFunctionLog(`getUserReminders`)
		return this._query(`
			SELECT * 
			FROM user_reminders
			WHERE user_id = $userId`
			, `all`
			, {userId:userId}
			, `${fn} fetching reminders for user (${userId})`
		)
	}

	/**
	 * Deleting reminder from database
	 * @return {QueryResult}
	 */
	deleteUserReminder(reminderId) {
		if (!reminderId) new TypeError(`${fn} parameter "reminderId" cannot be blank.`)
		const fn = this.formatFunctionLog(`deleteUserReminder`)
		return this._query(`
			DELETE FROM user_reminders
			WHERE reminder_id = $reminderId`
			, `run`
			, {reminderId: reminderId}
			, `${fn} Deleting reminder with id ${reminderId}`
		)
	}
}

class UserUtility extends DatabaseUtility {

	constructor(client) {
		super(client)
		this.fnClass = `UserUtility`
	}

	/**
	 * Updating user's experience points.
	 * @param {number} [amount=0] Amount to be added.
	 * @param {string} [userId] Target user's discord id.
	 * @param {string} [guildId] Target guild id.
	 * @param {string} [operation=`+`] Set as `-` to do exp substraction.
	 * @returns {QueryResult}
	 */
	async updateUserExp(amount = 0, userId = ``, guildId = ``, operation = `+`) {
		const fn = this.formatFunctionLog(`updateUserExp`)
		if (!amount) throw new TypeError(`${fn} parameter "amount" cannot be blank.`)
		if (typeof(amount) != `number`) throw new TypeError(`${fn} parameter "amount" must be a number.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (operation != `+` && operation != `-`) throw new RangeError(`${fn} parameter "operation" can only be "+" or "-"`)
		const res = {
			update: await this._query(`
                UPDATE user_exp 
                SET current_exp = current_exp ${operation} $value
                WHERE 
                    user_id = $userId
                    AND guild_id = $guildId`
				, `run`
				, {value:amount, userId:userId, guildId:guildId}
				, `${fn} updating user's exp`
			),
			insert: await this._query(`
                INSERT INTO user_exp(user_id, guild_id, current_exp)
                SELECT $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_exp WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { userId: userId, guildId: guildId, amount: amount }
				, `${fn} inserting record for user's exp`
			)
		}
		//  Refresh cache 
		this.redis.del(`EXP_${userId}@${guildId}`)
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`${fn}[${type}](${operation}) (EXP:${amount} | EXP_ID:${userId}@${guildId}`)
	}

	/**
	 * Pull user's main metadata
	 * @param {string} [userId] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUser(userId) {
		const fn = this.formatFunctionLog(`getUser`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		return this._query(`
			SELECT *
			FROM users
			WHERE user_id = $userId`
			, `get`
			, {userId:userId}
			, `${fn} fetch user main data`
		)
	}

	/**
	 * Pull user's experience points metadata.
	 * @param {string} [userId] Target user's discord id.
	 * @param {string} [guildId] Target guild.
	 * @returns {QueryResult}
	 */
	async getUserExp(userId, guildId) {
		const fn = this.formatFunctionLog(`getUser`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		const key = `EXP_${userId}@${guildId}`
		//  Retrieve from cache if available
		const cache = await this.redis.get(key)
		if (cache) return JSON.parse(cache)
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_exp
            WHERE user_id = $userId
            AND guild_id = $guildId`
			, `get`
			, {userId:userId, guildId:guildId}
			, `${fn} fetching user exp metadata`
		)
		let exp = await query()
		if (exp === null) {
			//  Register new entry and refetch
			await this.updateUserExp(0, userId, guildId)
			exp = await query()
		}
		//  Store for 1 minute expire
		this.redis.set(key, JSON.stringify(exp), `EX`, 60)
		return exp
	}

	/**
	 * Reset user's exp to zero. 
	 * @param {string} [userId] Target user's discord id.
	 * @param {string} [guildId] Target guild id.
	 * @return {void}
	 */
	resetUserExp(userId, guildId) {
		const fn = this.formatFunctionLog(`resetUserExp`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		const key = `EXP_${userId}@${guildId}`
		//  Update on database.
		const dbTime = process.hrtime()
		this._query(`
			UPDATE user_exp 
			SET current_exp = 0 
			WHERE 
				user_id = $userId
				AND guild_id = $guildId`
			, `run`
			, {userId:userId, guildId:guildId}
		).then(() => logger.debug(`${fn} updated ${key} on database. (${getBenchmark(dbTime)})`))
		//  Refresh cache by deleting it
		this.redis.del(key)
	}

	/**
	 * Fetch user's current artcoins/balance.
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {number}
	 */
	async getUserBalance(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserBalance`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		const res = await this._query(`
            SELECT * 
            FROM user_inventories 
            WHERE
                user_id = $userId
                AND guild_id = $guildId
                AND item_id = 52`
			, `get`
			, {userId:userId, guildId:guildId}
			, `${fn} fetching user's balance`
		)
		//  Fallback to zero if entry not exists.
		return res ? res.quantity : 0
	}

	/**
	 * Pull user's reputations metadata
	 * @param {string} [userId] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserReputation(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserReputation`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_reputations
            WHERE user_id = $userId
            AND guild_id = $guildId`
			, `get`
			, {userId:userId, guildId:guildId}
			, `${fn} get all reputations for user (${userId})`
		)
		let reps = await query()
		if (reps === null) {
			//  Register new entry and refetch
			await this.updateUserReputation(0, userId, null, guildId)
			reps = await query()
		}
		//  Store for 12 hours expire
		return reps
	}

	/**
	 * Updating user's reputation points into `user_reputations` table
	 * @param {number} [amount=0] amount to be added
	 * @param {string} [userId=``] target user's discord id
	 * @param {string} [givenBy=null] giver user's discord id. Optional
	 * @param {string} [guildId=``] Target user's guild id
	 * @param {string} [operation=`+`] Set `-` to subtract target reputation points.
	 * @returns {void}
	 */
	async updateUserReputation(amount = 0, userId = ``, givenBy = null, guildId = ``, operation = `+`) {
		const fn = this.formatFunctionLog(`updateUserReputation`)
		if (!amount) throw new TypeError(`${fn} parameter "amount" cannot be blank.`)
		if (typeof(amount) != `number`) throw new TypeError(`${fn} parameter "amount" must be a number.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (operation != `+` && operation != `-`) throw new RangeError(`${fn} parameter "operation" can only be "+" or "-"`)
		const res = {
			update: await this._query(`
                UPDATE user_reputations 
                SET 
                    total_reps = total_reps + $value,
                    last_received_at = datetime('now'),
                    recently_received_by = $receivedBy
                WHERE user_id = $userId AND guild_id = $guildId`
				, `run`
				, {value:amount, receivedBy:givenBy, userId:userId, guildId:guildId}
			),
			insert: await this._query(`
                INSERT INTO user_reputations(last_giving_at, user_id, guild_id, total_reps)
                SELECT datetime('now','-1 day'), $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_reputations WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { userId: userId, guildId: guildId, amount: amount }
			)
		}
		//  Refresh cache 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`${fn}[${type}](${operation}) (REPS:${amount} | EXP_ID:${userId}@${guildId}`)
	}

	/**
	 * TODO
	 * The rest of file
	 */

	
	/**
	 * Pull user's dailies metadata. Will use cache in available.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserDailies(userId = ``, guildId = ``) {
		//  Check for cache availability
		const key = `DAILIES_${userId}@${guildId}`
		const onCache = await this.redis.get(key)
		if (onCache) return JSON.parse(onCache)
		const stmt = `SELECT * FROM user_dailies WHERE user_id = ? AND guild_id = ?`
		const query = () => this._query(`
            SELECT *
            FROM user_dailies
            WHERE user_id = ?
            AND guild_id =?`
			, `get`
			, [userId, guildId]
		)
		let res = await query()
		if (res === null) {
			//  Register new entry then refetch
			await this.updateUserDailies(0, userId, guildId)
			res = await query()
		}
		//  Cache for 12 hours
		this.redis.set(key, JSON.stringify(res))
		return res
	}

	/**
	 * Adds new streak data and updating the timestamp for user dailies.
	 * @param {number} [streak=0] the amount of dailies streak to be set to `user_dailies.total_streak`
	 * @param {string} [userId=``] target user's discord id
	 * @param {string} [guildId=``] Target user's guild id
	 * @returns {void}
	 */
	async updateUserDailies(streak = 0, userId = ``, guildId = ``) {
		const res = {
			update: await this._query(`
                UPDATE user_dailies 
                SET 
                    updated_at = datetime('now'),
                    total_streak = ?
                WHERE user_id = ? AND guild_id = ?`
				, `run`
				, [streak, userId, guildId]
			),
			insert: await this._query(`
                INSERT INTO user_dailies(updated_at, total_streak, user_id, guild_id)
                SELECT datetime('now','-1 day'), -1, $userId, $guildId
                WHERE NOT EXISTS (SELECT 1 FROM user_dailies WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { userId: userId, guildId: guildId }
			)
		}
		//  Refresh cache
		this.redis.del(`DAILIES_${userId}@${guildId}`)
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_DAILIES][${type}] (STREAK:${streak} | DAILIES_ID:${userId}@${guildId}`)
	}

	/**
	 * Fetch user's relationship info
	 * @param {string} [userId=``] target user id
	 * @returns {QueryResult}
	 */
	getUserRelations(userId = ``) {
		return this._query(`
			SELECT 
				relationships.relationship_id AS "relationship_id",
				relationships.name AS "relationship_name",

				user_relationships.user_id_A AS "author_user_id",
				user_relationships.user_id_B AS "assigned_user_id"
			FROM user_relationships

			INNER JOIN relationships
			ON relationships.relationship_id = user_relationships.relationship_id

			WHERE 
				user_relationships.user_id_A = ?
				AND user_relationships.relationship_id > 0
				AND user_relationships.relationship_id IS NOT NULL
			ORDER BY user_relationships.registered_at DESC`
			, `all`
			, [userId]
		)
	}

	/**
	   * Pull user's quest data. It will create a new entry first if user is first-timer.
	   * @param {string} [userId=``] target user's data to be pulled
	   * @param {string} [guildId=``] target guild where user's data going to be pulled
	   * @return {QueryResult}
	   */
	async getUserQuests(userId = ``, guildId = ``) {
		//  Register user's quest data if not present
		await this._query(`
			INSERT INTO user_quests (updated_at, user_id, guild_id)
			SELECT datetime('now','-1 day'), $userId, $guildId
			WHERE NOT EXISTS (SELECT 1 FROM user_quests WHERE user_id = $userId AND guild_id = $guildId)`
			, `run`
			, { userId: userId, guildId: guildId }
		)
		return this._query(`
			SELECT *
			FROM user_quests
			WHERE 
				user_id = ?
				AND guild_id = ?`
			, `get`
			, [userId, guildId]
		)
	}

	/**
	 * Pull user's inventories metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserInventory(userId = ``, guildId = ``) {
		return this._query(`
			SELECT 

				user_inventories.registered_at AS registered_at,
				user_inventories.updated_at AS updated_at,
				user_inventories.item_id AS item_id,
				user_inventories.user_id AS user_id,
				user_inventories.quantity AS quantity,
				user_inventories.in_use AS in_use,

				items.name AS name,
				items.description AS description,
				items.alias AS alias,
				items.type_id AS type_id,
				items.rarity_id AS rarity_id,
				items.bind AS bind,
                items.owned_by_guild_id AS owned_by_guild_id,
                items.usable AS usable,
                items.response_on_use AS response_on_use,

				item_types.name AS type_name,
				item_types.alias AS type_alias,
				item_types.max_stacks AS type_max_stacks,
				item_types.max_use AS type_max_use,

				item_rarities.name AS rarity_name,
				item_rarities.level AS rarity_level,
				item_rarities.color AS rarity_color

			FROM user_inventories
			INNER JOIN items
			ON items.item_id = user_inventories.item_id
			INNER JOIN item_types 
			ON item_types.type_id = items.type_id
			INNER JOIN item_rarities
			ON item_rarities.rarity_id = items.rarity_id
			WHERE user_inventories.user_id = ? AND user_inventories.guild_id = ?`
			, `all`
			, [userId, guildId]
		)
	}

	/**
	 * Return user's cover data on specific guild
	 * @param {string} userId
	 & @param {string} guildId
	 * @return {QueryResult}
	 */
	async getUserCover(userId = ``, guildId = ``) {
		let onSelfCover = await this._query(`
			SELECT 
				registered_at,
				cover_id AS alias,
				user_id,
				guild_id
			FROM user_self_covers
			WHERE
				user_id = ?
				AND guild_id = ?`
			, `all`
			, [userId, guildId]
		)
		//  If self-upload is available, then return
		if (onSelfCover.length > 0) {
			onSelfCover[0].isSelfUpload = true
			return onSelfCover[0]
		}
		//  Else- find in user's inventory
		const inventory = await this.getUserInventory(userId, guildId)
		return inventory.filter(item => item.type_id === 1 && item.in_use === 1)[0]
	}

	/**
	 * Updating user's bio
	 * @param {string} [bio=``] User's input. Limit 156 character.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	setUserBio(bio = ``, userId = ``) {
		const fn = `[Database.setUserBio()]`
		if (typeof bio !== `string`) throw new TypeError(`${fn} parameter "bio" should be string.`)
		if (bio.length > 156) throw new RangeError(`${fn} parameter "bio" cannot exceed 156 characters!`)
		return this._query(`
			UPDATE users
			SET bio = ?
			WHERE user_id = ?`
			, `run`
			, [bio, userId]
			, `Updating bio for USER_ID:${userId}`
		)
	}

	/**
	 * Pull user's gender data
	 * @param {string} [userId=``] Target user id
	 * @return {object|null}
	 */
	getUserGender(userId = ``) {
		return this._query(`
            SELECT * FROM user_gender
            WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Updating user's gender data
	 * @param {string} [userId=``] Target user id
	 * @param {string} gender New gender
	 * @return {void}
	 */
	async updateUserGenderToneutral(userId = ``) {
		//	Insert if no data entry exists.
		await this._query(`
	            DELETE FROM user_gender 
				WHERE user_id = $userId`
			, `run`
			, { userId: userId }
		)
		logger.info(`[DB@UPDATE_USER_GENDER] UPDATE (GENDER: neutral)(USER_ID:${userId}`)
	}

	/**
	 * Updating user's gender data
	 * @param {string} [userId=``] Target user id
	 * @param {string} gender New gender
	 * @return {void}
	 */
	async updateUserGender(userId = ``, gender) {
		if (![`m`, `f`].includes(gender)) throw new TypeError(`Gender must be either 'm' or 'f'`)
		//	Insert if no data entry exists.
		const res = {
			insert: await this._query(`
	            INSERT INTO user_gender (user_id, gender)
				SELECT $userId, $gender
				WHERE NOT EXISTS (SELECT 1 FROM user_gender WHERE user_id = $userId)`
				, `run`
				, { userId: userId, gender: gender }
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_gender
				SET gender = ?
				WHERE 
					user_id = ?`
				, `run`
				, [gender, userId]
			)
		}
		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`[DB@UPDATE_USER_GENDER] ${stmtType} (GENDER:${gender})(USER_ID:${userId}`)
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	checkIfThemeOwned(theme, userId, guildId) {
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme)`
			, `get`
			, { theme: theme, userId: userId, guildId: guildId })
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	GiveThemeToUser(theme, userId, guildId) {
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this.updateInventory({ itemId: theme, value: 1, operation: `+`, userId: userId, guildId: guildId })
	}

	async findCurrentTheme(userId, guildId) {
		// first see if light theme is equiped
		let res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`
			, `get`
			, { theme: `4`, userId: userId, guildId: guildId })
		if (Object.values(res)[0] == 1) return `light`
		// second see if dark theme is equiped
		res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`
			, `get`
			, { theme: `3`, userId: userId, guildId: guildId })
		if (Object.values(res)[0] == 1) return `dark`
		return `none`
	}

	setTheme(theme, userId, guildId) {
		let themeToSet, themeToUnset
		if (theme == `dark`) {
			themeToSet = `3`
			themeToUnset = `4`
		} else if (theme == `light`) {
			themeToSet = `4`
			themeToUnset = `3`
		}
		this._query(`UPDATE user_inventories SET in_use = 1 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`
			, `run`
			, { theme: themeToSet, userId: userId, guildId: guildId })
		this._query(`UPDATE user_inventories SET in_use = 0 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`
			, `run`
			, { theme: themeToUnset, userId: userId, guildId: guildId })
		return
	}

	/**
	 * Pull user's language/locale data
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserLocale(userId = ``) {
		return this._query(`
			SELECT lang
			FROM users
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Updating the timestamp for reputation giver.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	updateReputationGiver(userId = ``, guildId = ``) {
		return this._query(`
			UPDATE user_reputations 
			SET last_giving_at = datetime('now')
			WHERE user_id = ? 
            AND guild_id = ?`
			, `run`
			, [userId, guildId]
		)
	}
}

class SystemUtility extends DatabaseUtility {

	constructor(client) {
		super(client)
		this.fnClass = `SystemUtility`
	}

	/**
	 * Records command query/usage everytime user uses it.
	 * @param {CommandUsage} meta required parameters
	 * @returns {QueryResult}
	 */
	recordsCommandUsage({ guild_id = ``, user_id = ``, command_alias = ``, resolved_in = `0ms` }) {
		return this._query(`
			INSERT INTO commands_log (
				registered_at, 
				user_id, 
				guild_id, 
				command_alias, 
				resolved_in
			)
			VALUES (datetime('now'), ?, ?, ?, ?)`
			, `run`
			, [user_id, guild_id, command_alias, resolved_in]
		)
	}

	/**
	 * Pull the total of command usage.
	 * @return {object}
	 */
	async getTotalCommandUsage() {
		const key = `TOTAL_CMD_USAGE`
		//  Retrieve from cache if available
		const cache = await this.getCache(key)
		if (cache !== null) return JSON.parse(cache)
		//  Else, hit db
		const res = await this._query(`
			SELECT COUNT(command_alias) AS 'total'
			FROM commands_log`
		)
		//  Store for 12 hours expire
		this.redis.set(key, JSON.stringify(res), `EX`, (60 * 60) * 12)
		return res
	}

	/**
	 * Converts db's timestamp to local/current machine date.
	 * @param {string} [timestamp=`now`] datetime from sql to be parsed from.
	 * @returns {string}
	 */
	async toLocaltime(timestamp = `now`) {
		const res = await this._query(`
			SELECT datetime(?, 'localtime') AS timestamp`
			, `get`
			, [timestamp]
		)
		return res.timestamp
	}
}

class GuildUtility extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `GuildUtility`
	}

	/**
	 * Fetch all the available guild configurations.
	 * @returns {QueryResult}
	 */
	async getAllGuildsConfigurations() {
		return this._query(`
			SELECT * 
			FROM guild_configurations`
			, `all`
		)
	}

	/**
	 * Fetch all the registered servers in affiliate table
	 * @return {QueryResult} 
	 */
	async getAffiliates() {
		return this._query(`
			SELECT *
			FROM affiliates`
			, `all`
			, []
			, `Fetching affiliates list`
		)
	}

	/**
	 * Registering guild to the list of guilds 
	 * @param {object} [guild={}] to be registered from.
	 * @returns {QueryResult}
	 */
	registerGuild(guild = {}) {
		return this._query(`
			INSERT INTO guilds (guild_id, name)
			SELECT $guildId, $guildName
			WHERE NOT EXISTS (SELECT 1 FROM guilds WHERE guild_id = $guildId)`
			, `run`
			, { guildId: guild.id, guildName: guild.name }
		)
	}

	/**
	 * Insert or update an existing guild config values
	 * @param {guildConfigurations} obj
	 * @returns {QueryResult}
	 */
	async updateGuildConfiguration({ configCode = null, guild = null, customizedParameter = null, setByUserId = null, cacheTo = {} }) {
		const fn = `[Database.updateGuildConfiguration()]`
		if (!configCode || typeof configCode !== `string`) throw new TypeError(`${fn} property "configCode" must be string and non-faulty value.`)
		if (!guild || typeof guild !== `object`) throw new TypeError(`${fn} property "guild" must be a guild object and non-faulty value.`)
		if (!setByUserId || typeof setByUserId !== `string`) throw new TypeError(`${fn} property "setByUserId" must be string and cannot be anonymous.`)
		//  Register guild incase they aren't registered yet
		this.registerGuild(guild)
		//  Parsing data type of customizedParameter so it can be stored in the database.
		//  The original type of customizedParameter remains unaffected.
		const parsedValueParameter = typeof customizedParameter === `object`
			? JSON.stringify(customizedParameter)
			: typeof customizedParameter === `number`
				? parseInt(customizedParameter)
				: customizedParameter
		const res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
			   INSERT INTO guild_configurations (config_code, customized_parameter, guild_id, set_by_user_id)
			   SELECT $configCode, $customizedParameter, $guildId, $setByUserId
			   WHERE NOT EXISTS (
				   SELECT 1 
				   FROM guild_configurations
				   WHERE 
					   config_code = $configCode
					   AND guild_id = $guildId
			   )`
				, `run`
				, {
					configCode: configCode,
					customizedParameter: parsedValueParameter,
					guildId: guild.id,
					setByUserId: setByUserId
				}
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
			   UPDATE guild_configurations
			   SET 
				   customized_parameter = ?,
				   set_by_user_id = ?,
				   updated_at = datetime('now')
			   WHERE 
				   config_code = ?
				   AND guild_id = ?`
				, `run`
				, [parsedValueParameter, setByUserId, configCode, guild.id]
			)
		}

		const type = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${type} (CONFIG_CODE:${configCode})(CUSTOMIZED_PARAMETER:${customizedParameter}) | (GUILD_ID:${guild.id})(USER_ID:${setByUserId})`)
		//  Cache result if provided 
		if (cacheTo) {
			const targetConfig = cacheTo.get(configCode)
			targetConfig.value = customizedParameter
			targetConfig.setByUserId = setByUserId
			targetConfig.updatedAt = await this.getCurrentTimestamp()
			logger.info(`${fn} cached ${configCode}@${guild.id}`)
		}
		return true
	}

	/**
	  * Get current timestamp in SQlite format
	  * @returns {string}
	  */
	async getCurrentTimestamp() {
		const res = await this._query(`SELECT CURRENT_TIMESTAMP`)
		return res.CURRENT_TIMESTAMP
	}

	/**
	 * Delete a guild's config from guild_configurations table
	 * @param {string} [configCode=``] the identifier code for a configuration/module
	 * @parma {string} [guildId=``] target guild 
	 * @returns {boolean}
	 */
	async deleteGuildConfiguration(configCode = ``, guildId = ``) {
		const fn = `[Database.deleteGuildConfiguration()]`
		if (!configCode || typeof configCode !== `string`) throw new TypeError(`${fn} property "configCode" must be a string-typed ID`)
		if (!guildId || typeof guildId !== `string`) throw new TypeError(`${fn} property "guildId" must be a string-typed ID`)
		//  Run entry
		const res = await this._query(`
			DELETE FROM guild_configurations
			WHERE
				config_code = ?
				AND guild_id = ?`
			, `run`
			, [configCode, guildId]
			, `Performing config(${configCode}) deletion for GUILD_ID:${guildId}`
		)
		const type = res.changes ? `DELETED` : `NO_CHANGES`
		logger.info(`${fn} ${type} (CONFIG_CODE:${configCode})(GUILD_ID:${guildId})`)
		return true
	}
}

class Relationships extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `Relationships`
	}

	/**
	 * Pull available relationship types
	 * @returns {QueryResult}
	 */
	getAvailableRelationships() {
		return this._query(`
			SELECT * FROM relationships
			WHERE name IN ('parent', 'kid', 'old sibling', 'young sibling', 'couple', 'bestfriend') ORDER BY relationship_id ASC`
			, `all`
		)
	}

	/**
	 * Removing user's relationship
	 * @param {string} [userA=``] Author's user id.
	 * @param {string} [userB=``] Target user's id to be assigned.
	 * @returns {QueryResult}
	 */
	removeUserRelationship(userA = ``, userB = ``) {
		return this._query(`
            DELETE FROM user_relationships
            WHERE 
            	user_id_A = ?
				AND user_id_B = ?`
			, `run`
			, [userA, userB]
			, `Removing ${userA} and ${userB} relationship.`
		)
	}

	/**
	 * Fetch metadata of a relationship type.
	 * @param {string} name Target relationship name
	 * @return {object|null}
	 */
	getRelationship(name) {
		return this._query(`
            SELECT *
            FROM relationships
            WHERE name = ?`
			, `get`
			, [name]
		)
	}

	/**
	 * Registering new user's relationship
	 * @param {string} [userA=``] Author's user id
	 * @param {string} [userB=``] Target user's id to be assigned
	 * @param {number} [relationshipId=0] assigned relationship's role id
	 * @param {string} [guildId=``] the guild id where the relationship is being registered in.
	 * @returns {QueryResult}
	 */
	async setUserRelationship(userA = ``, userB = ``, relationshipId = 0, guildId = ``) {
		const fn = `[Database.setUserRelationship()]`
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
	            INSERT INTO user_relationships (user_id_A, user_id_B, relationship_id, guild_id)
				SELECT $userA, $userB, $relationshipId, $guildId
				WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id_A = $userA AND user_id_B = $userB)`
				, `run`
				, { userA: userA, userB: userB, relationshipId: relationshipId, guildId: guildId }
				, `Registering new relationship for ${userA} and ${userB} in GUILD_ID ${guildId}`
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_relationships
				SET relationship_id = ?
				WHERE 
					user_id_A = ?
					AND user_id_B = ?`
				, `run`
				, [relationshipId, userA, userB]
			)
		}

		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${stmtType} (REL_ID:${relationshipId})(USER_A:${userA} WITH USER_B:${userB})`)
		return true
	}
}


class AutoResponder extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `AutoResponder`
	}

	/**
	 * Retrieve all guilds that have auto responders registered.
	 * @return {QueryResult}
	 */
	getGuildsWithAutoResponders() {
		return this._query(`
			SELECT DISTINCT guild_id
			FROM autoresponders`
			, `all`
			, []
		)
	}

	/**
	 * Retrieving all the registered ARs from specific guild.
	 * @param {string} [guildId=``] Target guild.
	 * @param {boolean} [fetchCache=true] Toggle false to make it always fetching from database.
	 * @return {QueryResult}
	 */
	async getAutoResponders(guildId = ``, fetchCache = true) {
		//  Check in cache
		const cacheID = `REGISTERED_AR@${guildId}`
		if (fetchCache && await this.isCacheExist(cacheID)) return JSON.parse(await this.getCache(cacheID))
		return this._query(`
			SELECT *
			FROM autoresponders
			WHERE guild_id = ?`
			, `all`
			, [guildId]
		)
	}

	/**
	 * Registering new autoresponder to specific guild.
	 * @param {AutoresponderMetadata} [meta={}] The AR metadata to be registered.
	 * @return {QueryResult}
	 */
	async registerAutoResponder({ guildId = ``, userId = ``, trigger = ``, response = `` }) {
		//  Insert into cache
		let cache = []
		const cacheID = `REGISTERED_AR@${guildId}`
		if (await this.isCacheExist(cacheID)) cache = JSON.parse(await this.getCache(cacheID))
		await this._query(`
			INSERT INTO autoresponders(
				guild_id,
				user_id,
				trigger,
				response
			)
			VALUES(?, ?, ?, ?)`
			, `run`
			, [guildId, userId, trigger, response]
			, `Inserting new AR for GUILD_ID:${guildId}`
		)
		const ARmeta = (await this._query(`
			SELECT *
			FROM autoresponders
			WHERE guild_id = ?
			ORDER BY ar_id DESC`
			, `all`
			, [guildId]
		))[0]
		cache.push({
			registered_at: ARmeta.registered_at,
			guild_id: ARmeta.guild_id,
			ar_id: ARmeta.ar_id,
			user_id: ARmeta.user_id,
			trigger: ARmeta.trigger,
			response: ARmeta.response
		})
		this.setCache(cacheID, JSON.stringify(cache))
	}

	/**
	 * Deleting an autoresponder from specific guild.
	 * @param {number} id Target AR id.
	 * @param {string} [guildId=``] Target guild.
	 * @return {QueryResult}
	 */
	async deleteAutoResponder(id, guildId = ``) {
		//  Delete element from cache if available
		const cacheID = `REGISTERED_AR@${guildId}`
		if (await this.isCacheExist(cacheID)) {
			const cache = JSON.parse(await this.getCache(cacheID))
			const updatedCache = cache.filter(node => node.ar_id !== id)
			//  Delete whole array if updatedCache is empty
			if (updatedCache.length <= 0) {
				this.clearCache(cacheID)
			}
			//  Else, just update the array
			else {
				this.setCache(cacheID, JSON.stringify(updatedCache))
			}
		}
		return this._query(`
			DELETE FROM autoresponders
			WHERE 
				ar_id = ?
				AND guild_id = ?`
			, `run`
			, [id, guildId]
			, `Deleting AR with ID:${id} from GUILD_ID:${guildId}`
		)
	}

	/**
	 * Deletes all the registered ARs from specific guild.
	 * @param {string} [guildId=``] Target guild.
	 * @return {QueryResult}
	 */
	clearAutoResponders(guildId = ``) {
		//  Clear ARs in cache
		this.clearCache(`REGISTERED_AR@${guildId}`)
		return this._query(`
			DELETE FROM autoresponders
			WHERE guild_id = ?`
			, `run`
			, [guildId]
			, `Deleting all ARs from GUILD_ID:${guildId}`
		)
	}
}

class DurationalBuffs extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `DurationalBuffs`
	}

	/**
	 * Fetch all the saved user's durational buffs.
	 * @param {string} userId If not provided, will fetch all the available buffs instead.
	 * @return {object}
	 */
	getSavedUserDurationalBuffs(userId) {
		if (userId) return this._query(`
            SELECT *
            FROM user_durational_buffs
            WHERE user_id = ?`
			, `all`
			, [userId]
		)
		return this._query(`
            SELECT *
            FROM user_durational_buffs`
			, `all`
		)
	}

	/**
	 * Registering new user's durational buff. If there's a buff with same name and multiplier
	 * its metadata will be updated and the oldest one will be replaced.
	 * @param {string} buffType
	 * @param {string} name
	 * @param {number} multiplier
	 * @param {string} duration
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {void}
	 */
	registerUserDurationalBuff(buffType, name, multiplier, duration, userId, guildId) {
		this._query(`
            SELECT COUNT(*) AS instance
            FROM user_durational_buffs
            WHERE
                type = ?
                AND name = ?
                AND multiplier = ?
                AND user_id = ?
                AND guild_id = ?`
			, `get`
			, [buffType, name, multiplier, userId, guildId]
		).then(res => {
			//  Update duration
			if (res.instance > 0) return this._query(`
                UPDATE user_durational_buffs
                SET registered_at = datetime('now')
                WHERE
                    type = ?
                    AND name = ?
                    AND multiplier = ?
                    AND user_id = ?
                    AND guild_id = ?`
				, `run`
				, [buffType, name, multiplier, userId, guildId]
			)
			this._query(`
                INSERT INTO user_durational_buffs(
                    type,
                    name,
                    multiplier,
                    duration,
                    user_id,
                    guild_id
                )
                VALUES(?, ?, ?, ?, ?, ?)`
				, `run`
				, [buffType, name, multiplier, duration, userId, guildId]
			)
		})
	}

	/**
	 * Deleting specific user's durational buff.
	 * @param {number} buffId
	 * @return {void}
	 */
	removeUserDurationalBuff(buffId) {
		this._query(`
            DELETE FROM user_durational_buffs
            WHERE buff_id = ?`
			, `run`
			, [buffId]
		)
			.then(res => {
				if (res.changes > 0) logger.debug(`[REMOVE_USER_DURATION_BUFF] BUFF_ID:${buffId} has finished and omited.`)
			})
	}

	/**
	 * Retrieve the ID of auser's specific durational buff.
	 * @param {string} buffType
	 * @param {string} name
	 * @param {number} multiplier
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {number|null}
	 */
	async getUserDurationalBuffId(buffType, name, multiplier, userId, guildId) {
		const res = await this._query(`
            SELECT buff_id
            FROM user_durational_buffs
            WHERE
                type = ?
                AND name = ?
                AND multiplier = ?
                AND user_id = ?
                AND guild_id =?`
			, `get`
			, [buffType, name, multiplier, userId, guildId]
		)
		return res.buff_id || null
	}
}

class CustomRewards extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `CustomRewards`
	}

	getRewardAmount(guildId) {
		return this._query(`SELECT * FROM custom_rewards WHERE guild_id = $guild_id`
			, `all`
			, { guild_id: guildId }
		)
	}

	recordReward(guildId, userId, rewardBlob, rewardName) {
		return this._query(` INSERT INTO custom_rewards (registered_at, guild_id, set_by_user_id, reward, reward_name)
		VALUES (datetime('now'), $guild_id, $user_id, $reward, $rewardName)`
			, `run`
			, { guild_id: guildId, user_id: userId, reward: rewardBlob, rewardName: rewardName }
		)
	}

	deleteReward(guildId, rewardName) {
		return this._query(` DELETE FROM custom_rewards WHERE guild_id = $guild_id AND reward_name = $rewardName`
			, `run`
			, { guild_id: guildId, rewardName: rewardName }
		)
	}
}

class Covers extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `Covers`
	}

	/**
	 * Detach user's covers. Aftewards, combined with `this.useItem()`
	 * @param {string} [userId=``] target user's id.
	 * @param {string} [guidId=``] target guild
	 * @returns {QueryResult}
	 */
	async detachCovers(userId = ``, guildId = ``) {
		const fn = `[Database.detachCovers()]`
		const res = await this._query(`
    		UPDATE user_inventories
    		SET in_use = 0
    		WHERE 
    			user_id = ?
    			AND guild_id = ?
    			AND item_id IN (
    				SELECT item_id
    				FROM items
    				WHERE type_id = 1 
    			)`
			, `run`
			, [userId, guildId]
			, `${fn} Detaching covers from USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		return res
	}

	/**
	 * Applying new cover to user's profile.
	 * @param {number} [coverId] target cover to be applied.
	 * @param {string} [userId=``] target user's id.
	 * @param {string} [guidId=``] target guild
	 * @returns {QueryResult}
	 */
	async applySelfUploadCover(coverId, userId = ``, guildId = ``) {
		const fn = `[Database.appleSelfCover()]`
		if (!coverId) throw new TypeError(`${fn} parameter 'coverId' cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter 'guildId' cannot be blank.`)
		const res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
				INSERT INTO user_self_covers (cover_id, user_id, guild_id)
				SELECT $coverId, $userId, $guildId
				WHERE NOT EXISTS (SELECT 1 FROM user_self_covers WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { coverId: coverId, userId: userId, guildId: guildId }
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_self_covers
				SET 
					cover_id = ?,
					registered_at = datetime('now')
				WHERE 
					user_id = ? 
					AND guild_id = ?`
				, `run`
				, [coverId, userId, guildId]
			)
		}
		return res
	}

	/**
	 * Deleting self-upload cover
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {QueryResult}
	 */
	deleteSelfUploadCover(userId = ``, guildId = ``) {
		return this._query(`
			DELETE FROM user_self_covers
			WHERE
				user_id = ?
				AND guild_id = ?`
			, `run`
			, [userId, guildId]
			, `Performing self-upload cover deletion on USER_ID:${userId} on GUILD_ID:${guildId}`
		)
	}

	/**
	 * Applying new cover to user's profile.
	 * @param {number} [coverId] target cover to be applied.
	 * @param {string} [userId=``] target user's id.
	 * @param {string} [guidId=``] target guild
	 * @returns {QueryResult}
	 */
	async applyCover(coverId, userId = ``, guildId = ``) {
		const fn = `[Database.applyCover()]`
		if (!coverId) throw new TypeError(`${fn} parameter 'coverId' cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter 'guildId' cannot be blank.`)
		const res = await this._query(`
    		UPDATE user_inventories
    		SET in_use = 1
    		WHERE 
    			item_id = ?
    			AND user_id = ?
    			AND guild_id = ?`
			, `run`
			, [coverId, userId, guildId]
			, `${fn} Applying cover[${coverId}] for USER_ID${userId} in GUILD_ID:${guildId}`
		)
		return res
	}
}

class Shop extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `Shop`
	}

	/**
	 * Fetch items from `item_gacha` table.
	 * @returns {QueryResult}
	 */
	async getGachaRewardsPool() {
		const cacheId = `GACHA_REWARDS_POOL`
		const onCache = await this.redis.get(cacheId)
		if (onCache) return JSON.parse(onCache)
		const res = await this._query(`
			SELECT 

				item_gacha.item_id AS item_id,
				item_gacha.quantity AS quantity,
				item_gacha.weight AS weight,

				items.name AS name,
				items.description AS description,
				items.alias AS alias,
				items.type_id AS type_id,
				items.rarity_id AS rarity_id,
				items.bind AS bind,

				item_types.name AS type_name,
				item_types.alias AS type_alias,
				item_types.max_stacks AS type_max_stacks,
				item_types.max_use AS type_max_use,

				item_rarities.name AS rarity_name,
				item_rarities.level AS rarity_level,
				item_rarities.color AS rarity_color

			FROM item_gacha
			INNER JOIN items
				ON items.item_id = item_gacha.item_id
			INNER JOIN item_types
				ON item_types.type_id = items.type_id
			INNER JOIN item_rarities
				ON item_rarities.rarity_id = items.rarity_id
            WHERE owned_by_guild_id IS NULL`
			, `all`
		)
		//  Cache rewards pool for 1 hour
		this.redis.set(cacheId, JSON.stringify(res), `EX`, 60 * 60)
		return res
	}

	/**
	 * Registering new item into database
	 * @param {item} item
	 * @return {QueryResult}
	 */
	registerItem(item) {
		return this._query(`
            INSERT INTO items(
                name,
                description,
                alias,
                type_id,
                rarity_id,
                bind,
                owned_by_guild_id,
                response_on_use,
                usable
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
			, `run`
			, [
				item.name,
				item.description,
				item.alias,
				item.typeId,
				item.rarityId,
				item.bind,
				item.ownedByGuildId,
				item.responseOnUse,
				item.usable
			]
		)
	}

	/**
	 * Registering new item into guild's shop.
	 * @param {number} itemId
	 * @param {string} guildId
	 * @param {number} quantity
	 * @param {number} price
	 * @return {QueryResult}
	 */
	registerGuildShopItem(itemId, guildId, quantity, price) {
		return this._query(`
            INSERT INTO shop(item_id, guild_id, quantity, price)
            VALUES(?, ?, ?, ?)`
			, `run`
			, [itemId, guildId, quantity, price]
		)
	}

	/**
	 * Registering new item effects
	 * @param {number} itemId
	 * @param {string} guildId
	 * @param {string} effectRefTId
	 * @param {*} parameters Custom parameter for the item effects.
	 * @return {QueryResult}
	 */
	registerItemEffects(itemId, guildId, effectRefId, parameters) {
		return this._query(`
            INSERT INTO item_effects(
                item_id,
                guild_id,
                effect_ref_id,
                parameter)
            VALUES(?, ?, ?, ?)`
			, `run`
			, [itemId, guildId, effectRefId, JSON.stringify(parameters)]
		)
	}

	/**
	 * Updating item's metadata.
	 * @param {number} itemId
	 * @param {string} targetProperty Target column to edit
	 * @param {*} param New value for target property 
	 * @return {void}
	 */
	updateItemMetadata(itemId, targetProperty, param) {
		this._query(`
            UPDATE items
            SET ${targetProperty} = ?
            WHERE item_id = ?`
			, `run`
			, [param, itemId]
		)
	}

	/**
	 * Updating item's metadata in shop table.
	 * @param {number} itemId
	 * @param {string} targetProperty Target column to edit
	 * @param {*} param New value for target property 
	 * @return {void}
	 */
	updateShopItemMetadata(itemId, targetProperty, param) {
		this._query(`
            UPDATE shop
            SET ${targetProperty} = ?
            WHERE item_id = ?`
			, `run`
			, [param, itemId]
		)
	}

	/**
	* Remove an item from the shops table
	* @param {number} [itemId] target item to search.
	* @returns {QueryResult}
	*/
	removeGuildShopItem(itemId) {
		return this._query(`
			DELETE FROM shop
			WHERE item_id = $itemId`
			, `run`
			, { itemId: itemId }
		)
	}

	/**
	 * Pull any item metadata from `items` table. Supports dynamic search.
	 * @param {ItemKeyword} keyword ref to item id, item name or item alias.
	 * @param {string} [guildId=null] Limit search to specific guild's owned items only. Optional. 
	 * @returns {QueryResult}
	 */
	getItem(keyword = ``, guildId = null) {
		const str = `SELECT 

				items.item_id AS item_id,
				items.name AS name,
				items.description AS description,
				items.alias AS alias,
				items.type_id AS type_id,
				items.rarity_id AS rarity_id,
				items.bind AS bind,
                items.owned_by_guild_id AS owned_by_guild_id,
                items.usable AS usable,
                items.response_on_use AS response_on_use,

				item_types.name AS type_name,
				item_types.alias AS type_alias,
				item_types.max_stacks AS type_max_stacks,
				item_types.max_use AS type_max_use,

				item_rarities.name AS rarity_name,
				item_rarities.level AS rarity_level,
				item_rarities.color AS rarity_color

			FROM items
			INNER JOIN item_types
				ON item_types.type_id = items.type_id
			INNER JOIN item_rarities
				ON item_rarities.rarity_id = items.rarity_id`
		//  Do whole fetch on specific guild
		if (keyword === null && typeof guildId === `string`) return this._query(str + ` WHERE owned_by_guild_id = ?`
			, `all`
			, [guildId]
		)
		//  Do single fetch on specific guild
		if (keyword && typeof guildId === `string`) return this._query(str + `
            WHERE 
                owned_by_guild_id = $guildId
                AND lower(items.name) = lower($keyword)`
			, `get`
			, { keyword: keyword, guildId: guildId }
		)
		return this._query(str + ` 
			WHERE 
				items.item_id = $keyword
				OR lower(items.name) = lower($keyword)
				OR lower(items.alias) = lower($keyword)
			LIMIT 1`
			, `get`
			, { keyword: keyword }
		)
	}

	/**
	 * Fetch all the registered purchasable items in target server.
	 * @param {string} guildId
	 * @return {object}
	 */
	getGuildShop(guildId) {
		return this._query(`
            SELECT *
            FROM shop
            WHERE guild_id = ?`
			, `all`
			, [guildId]
		)
	}

	/**
	 * Subtract item's supply from shop table.
	 * @param {number} itemId
	 * @param {number} [amount=1] Amount to subtract
	 * @return {void}
	 */
	subtractItemSupply(itemId, amount = 1) {
		this._query(`
            UPDATE shop
            SET quantity = quantity - ?
            WHERE item_id = ?`
			, `run`
			, [amount, itemId]
		)
	}

	/**
	 * Fetch registered effects for specified item.
	 * @param {number} itemId
	 * @return {object}
	 */
	getItemEffects(itemId) {
		return this._query(`
            SELECT *
            FROM item_effects
            WHERE item_id = ?`
			, `all`
			, [itemId]
		)
	}

}

class Quests extends DatabaseUtility {
	constructor(client) {
		super(client)
		this.fnClass = `Quests`
	}

	async registerQuest(reward_amount, name, description, correct_answer) {
		if (!reward_amount) return new Error(`The parameter 'reward_amount' is missing, it must be an Integer`)
		if (!name) return new Error(`The parameter 'name' is missing, it must be an String`)
		if (!description) return new Error(`The parameter 'description' is missing, it must be an String`)
		if (!correct_answer) return new Error(`The parameter 'correct_answer' is missing, it must be an String`)
		if (typeof (reward_amount) != Number) return new TypeError(`The parameter 'reward_amount' is missing, it must be an Integer`)
		if (typeof (name) != String) return new TypeError(`The parameter 'name' is missing, it must be an String`)
		if (typeof (description) != String) return new TypeError(`The parameter 'description' is missing, it must be an String`)
		if (typeof (correct_answer) != String) return new TypeError(`The parameter 'correct_answer' is missing, it must be an String`)
		return await this._query(`
		INSERT INTO quests(
			reward_amount,
			name,
			description,
			correct_answer
		)
		VALUES($reward_amount, $name, $description,	$correct_answer)`, `run`, { reward_amount: reward_amount, name: name, description: description, correct_answer: correct_answer }, `Registered new quest`)
	}

	/**
	   * Pull all the available quests in quests master table
	   * @return {QueryResult}
	   */
	async getAllQuests() {
		const cacheId = `CACHED_QUESTS_POOL`
		const cache = await this.redis.get(cacheId)
		if (cache !== null) return JSON.parse(cache)
		const res = await this._query(`
			SELECT *
			FROM quests`
			, `all`
			, []
			, `Fetching all the available quests in master quests table`
		)
		//  Store quest pool cache for 3 hours.
		this.redis.set(cacheId, JSON.stringify(res), `EX`, (60 * 60) * 3)
		return res
	}

	/**
	   * Refreshing user next's quest_id
	   * @param {string} [userId=``] target user's data to be updated
	   * @param {string} [guildId=``] target guild where user's data going to be updated
	   * @param {string} [nextQuestId=``] quest_id to be supplied on user's next quest take
	   * @return {QueryResult}
	   */
	updateUserNextActiveQuest(userId = ``, guildId = ``, nextQuestId = ``) {
		return this._query(`
			UPDATE user_quests
			SET next_quest_id = ?
			WHERE
				user_id = ?
				AND guild_id = ?`
			, `run`
			, [nextQuestId, userId, guildId]
			, `Updating next active quest ID for ${userId}@${guildId}`
		)
	}

	/**
	   * Update user's quest data after completing a quest
	   * @param {string} [userId=``] target user's data to be updated
	   * @param {string} [guildId=``] target guild where user's data going to be updated
	   * @param {string} [nextQuestId=``] quest_id to be supplied on user's next quest take
	   * @return {QueryResult}
	   */
	updateUserQuest(userId = ``, guildId = ``, nextQuestId = ``) {
		return this._query(`
			UPDATE user_quests
			SET 
				updated_at = datetime('now'),
				next_quest_id = ?
			WHERE
				user_id = ?
				AND guild_id = ?`
			, `run`
			, [nextQuestId, userId, guildId]
			, `Updating ${userId}@${guildId} quest data`
		)
	}

	/**
	   * Log user's quest activity after completing a quest
	   * @param {string} [userId=``] user that completes the quest
	   * @param {string} [guildId=``] target guild where quest get completed
	   * @param {string} [questId=``] the quest user just took
	   * @param {string} [answer=``] the answer used to clear the quest
	   * @return {QueryResult}
	   */
	recordQuestActivity(questId = ``, userId = ``, guildId = ``, answer = ``) {
		return this._query(`
			INSERT INTO quest_log(
				guild_id,
				quest_id,
				user_id,
				answer
			)
			VALUES(?, ?, ?, ?)`
			, `run`
			, [questId, userId, guildId, answer]
			, `Storing ${userId}@${guildId} quest's activity to quest_log table`
		)
	}
}

/* class Template extends DatabaseUtility{
	constructor(client){
		super(client)
	}
	
} */

module.exports = Database