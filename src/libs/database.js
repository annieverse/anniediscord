const { Client, types } = require(`pg`)
//  Remove pg's number to string conversion
types.setTypeParser(20, function(val) {
    return parseInt(val, 10)
})
const Redis = require(`async-redis`)
const logger = require(`pino`)({ name: `DATABASE`, level: `debug` })
const getBenchmark = require(`../utils/getBenchmark`)

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
	 * @returns {this}
	 */
	connect() {
		this.client = new Client({
			host: process.env.PG_HOST,
			database: process.env.PG_DB,
			user: process.env.PG_USER,
			password: process.env.PG_PASS,
			port: process.env.PG_PORT
		})
		this.client
		.connect()
		.then(() => {
			logger.info(`PostgreSQL server connected on PORT:${process.env.PG_PORT}.`)
		})
		.catch(err => {
			logger.error(`PostgreSQL server fails to connect >> ${err.message}`)
			process.exit()
		})
		this.connectRedis()
		return this
	}

	initializeDb() {
		this.databaseUtils = new DatabaseUtils(this)
		this.quests = new Quests(this)
		this.reminders = new Reminders(this)
		this.guildUtils = new GuildUtils(this)
		this.autoResponder = new AutoResponder(this)
		this.durationalBuffs = new DurationalBuffs(this)
		this.userUtils = new UserUtils(this)
		this.systemUtils = new SystemUtils(this)
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

class DatabaseUtils {
	constructor(obj) {
		this.client = obj.client
		this.redis = obj.redis
		this.fnClass = `DatabaseUtils`
	}

	/**
	 * Parsing query to match with PostgreSQL format.
	 * @param {string} query 
	 * @param {object} params 
	 * @return {object}
	 */
	_convertNamedParamsToPositionalParams(query, params) {
		let positionalParams = [];
		let index = 1;
	
		const convertedQuery = query.replace(/\$\w+/g, (param) => {
			const paramName = param.slice(1);
			if (params.hasOwnProperty(paramName)) {
				positionalParams.push(params[paramName]);
			} else {
				throw new Error(`Missing value for parameter ${paramName}`);
			}
			return `$${index++}`;
		});
	
		return [convertedQuery, positionalParams];
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
		if (type === `run`) stmt = stmt + ` RETURNING *`
		const [ parsedStatement, parsedParameters ] = this._convertNamedParamsToPositionalParams(stmt, supplies)
		let result = await this.client.query(parsedStatement, parsedParameters)
		if (!result) return null
		if (log) logger.info(log)
		if (type === `all`) return result.rows
		if (type === `run`) {
			result.changes = result.rowCount
			return result
		}
		return result.rows[0]
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
						updated_at = CURRENT_TIMESTAMP
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
						updated_at = CURRENT_TIMESTAMP
						WHERE item_id = $itemId AND user_id = $userId AND guild_id = $guildId`
					, `run`
					, { value: value, itemId: itemId, userId: userId, guildId: guildId }
					, `${fn} Updating user's inventory`
				)
			}
		}

		logger.info(`${fn} (${distributeMultiAccounts ? `distributeMultiAccounts` : ``})(${operation}) (ITEM_ID:${itemId})(QTY:${value}) | USER_ID ${userId}`)
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

	arrayEquals(a, b) {
		return Array.isArray(a) &&
			Array.isArray(b) &&
			a.length === b.length &&
			a.every((val, index) => val === b[index])
	}
}

class Reminders extends DatabaseUtils {
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

		const validKeys = [
			`registeredAt`,
			`id`,
			`userId`,
			`message`,
			`remindAt`,
			`isValidReminder`
		]
		if (!context) new TypeError(`${fn} parameter "context" cannot be blank.`)
		if (typeof (context) === `object` && this.arrayEquals(Object.keys(context), validKeys)) new TypeError(`${fn} parameter "context" must be a object and include the following: registeredAt, id, userId, message, and remindAt.`)
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
			, { registeredAt: context.registeredAt.toString(), reminderId: context.id, userId: context.userId, message: context.message, remindAt: JSON.stringify(context.remindAt) }
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
			, { userId: userId }
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
			, { reminderId: reminderId }
			, `${fn} Deleting reminder with id ${reminderId}`
		)
	}
}

class UserUtils extends DatabaseUtils {

	constructor(client) {
		super(client)
		this.fnClass = `UserUtils`
	}

	/**
	 * Updating user's experience points.
	 * @param {number} [amount=0] Amount to be added.
	 * @param {string} { userId: userId } Target user's discord id.
	 * @param {string} [guildId] Target guild id.
	 * @param {string} [operation=`+`] Set as `-` to do exp substraction.
	 * @returns {QueryResult}
	 */
	async updateUserExp(amount = 0, userId = ``, guildId = ``, operation = `+`) {
		const fn = this.formatFunctionLog(`updateUserExp`)
		if (!amount) throw new TypeError(`${fn} parameter "amount" cannot be blank.`)
		if (typeof (amount) != `number`) throw new TypeError(`${fn} parameter "amount" must be a number.`)
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
				, { value: amount, userId: userId, guildId: guildId }
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
	 * @param {string} { userId: userId } target user's discord id
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
			, { userId: userId }
			, `${fn} fetch user main data`
		)
	}

	/**
	 * Pull user's experience points metadata.
	 * @param {string} { userId: userId } Target user's discord id.
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
			, { userId: userId, guildId: guildId }
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
	 * @param {string} { userId: userId } Target user's discord id.
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
			, { userId: userId, guildId: guildId }
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
			, { userId: userId, guildId: guildId }
			, `${fn} fetching user's balance`
		)
		//  Fallback to zero if entry not exists.
		return res ? res.quantity : 0
	}

	/**
	 * Pull user's reputations metadata
	 * @param {string} { userId: userId } target user's discord id
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
			, { userId: userId, guildId: guildId }
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
		if (typeof (amount) != `number`) throw new TypeError(`${fn} parameter "amount" must be a number.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (operation != `+` && operation != `-`) throw new RangeError(`${fn} parameter "operation" can only be "+" or "-"`)
		const res = {
			update: await this._query(`
                UPDATE user_reputations 
                SET 
                    total_reps = total_reps + $value,
                    last_received_at = CURRENT_TIMESTAMP,
                    recently_received_by = $receivedBy
                WHERE user_id = $userId AND guild_id = $guildId`
				, `run`
				, { value: amount, receivedBy: givenBy, userId: userId, guildId: guildId }
				, `${fn} update reputations for user (${userId})`
			),
			insert: await this._query(`
                INSERT INTO user_reputations(last_giving_at, user_id, guild_id, total_reps)
                SELECT DATE('now'::timestamp - INTERVAL '1 day'), $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_reputations WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { userId: userId, guildId: guildId, amount: amount }
				, `${fn} inserting reputations record if not exists for user (${userId})`
			)
		}
		//  Refresh cache 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`${fn}[${type}](${operation}) (REPS:${amount} | EXP_ID:${userId}@${guildId}`)
	}

	/**
	 * Pull user's dailies metadata. Will use cache in available.
	 * @param {string} userId target user's discord id
	 * @param {string} guildId target guild's discord id
	 * @returns {QueryResult}
	 */
	async getUserDailies(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserDailies`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		//  Check for cache availability
		const key = `DAILIES_${userId}@${guildId}`
		const onCache = await this.redis.get(key)
		if (onCache) return JSON.parse(onCache)
		const query = () => this._query(`
            SELECT *
            FROM user_dailies
            WHERE user_id = $userId
            AND guild_id = $guildId`
			, `get`
			, { userId: userId, guildId: guildId }
			, `${fn} fetching user daily metadata`
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
		const fn = this.formatFunctionLog(`updateUserDailies`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (typeof (streak) != `number`) throw new TypeError(`${fn} parameter "streak" must be a number.`)
		const res = {
			update: await this._query(`
                UPDATE user_dailies 
                SET 
                    updated_at = CURRENT_TIMESTAMP,
                    total_streak = $totalStreak
                WHERE user_id = $userId AND guild_id = $guildId`
				, `run`
				, { totalStreak: streak, userId: userId, guildId: guildId }
				, `${fn} updating user's daily streak`
			),
			insert: await this._query(`
                INSERT INTO user_dailies(updated_at, total_streak, user_id, guild_id)
                SELECT DATE('now'::timestamp - INTERVAL '1 day'), -1, $userId, $guildId
                WHERE NOT EXISTS (SELECT 1 FROM user_dailies WHERE user_id = $userId AND guild_id = $guildId)`
				, `run`
				, { userId: userId, guildId: guildId }
				, `${fn} inserting record for user daily streak`
			)
		}
		//  Refresh cache
		this.redis.del(`DAILIES_${userId}@${guildId}`)
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_DAILIES][${type}] (STREAK:${streak} | DAILIES_ID:${userId}@${guildId}`)
	}

	/**
	 * Fetch user's relationship info
	 * @param {string} userId target user id
	 * @returns {QueryResult}
	 */
	getUserRelations(userId) {
		const fn = this.formatFunctionLog(`getUserRelations`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
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
				user_relationships.user_id_A = $userId
				AND user_relationships.relationship_id > 0
				AND user_relationships.relationship_id IS NOT NULL
			ORDER BY user_relationships.registered_at DESC`
			, `all`
			, { userId: userId }
			, `${fn} fetching all user relationships for user (${userId})`
		)
	}

	/**
	   * Pull user's quest data. It will create a new entry first if user is first-timer.
	   * @param {string} userId target user's data to be pulled
	   * @param {string} guildId target guild where user's data going to be pulled
	   * @return {QueryResult}
	   */
	async getUserQuests(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserQuests`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		//  Register user's quest data if not present
		await this._query(`
			INSERT INTO user_quests (updated_at, user_id, guild_id)
			SELECT DATE('now'::timestamp - INTERVAL '1 day'), $userId, $guildId
			WHERE NOT EXISTS (SELECT 1 FROM user_quests WHERE user_id = $userId AND guild_id = $guildId)`
			, `run`
			, { userId: userId, guildId: guildId }
			, `${fn} insert new quest in not exists, for user (${userId})`
		)
		return this._query(`
			SELECT *
			FROM user_quests
			WHERE 
				user_id = $userId
				AND guild_id = $guildId`
			, `get`
			, { userId: userId, guildId: guildId }
			, `${fn} fetch all user quests for user (${userId})`
		)
	}

	/**
	 * Pull user's inventories metadata
	 * @param {string} userId target user's discord id
	 * @param {string} guildId target guild's discord id
	 * @returns {QueryResult}
	 */
	async getUserInventory(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserInventory`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
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
			WHERE user_inventories.user_id = $userId AND user_inventories.guild_id = $guildId`
			, `all`
			, { userId: userId, guildId: guildId }
			, `${fn} fetch user inventory metadata for user (${userId}) in guild (${guildId})`
		)
	}

	/**
	 * Return user's cover data on specific guild
	 * @param {string} userId
	 & @param {string} guildId
	 * @return {QueryResult}
	 */
	async getUserCover(userId, guildId) {
		const fn = this.formatFunctionLog(`getUserCover`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		let onSelfCover = await this._query(`
			SELECT 
				registered_at,
				cover_id AS alias,
				user_id,
				guild_id
			FROM user_self_covers
			WHERE
				user_id = $userId
				AND guild_id = $guildId`
			, `all`
			, { userId: userId, guildId: guildId }
			, `${fn} fetch cover for user (${userId})`
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
	 * @param {string} bio User's input. Limit 156 character.
	 * @param {string} userId User's discord id.
	 * @returns {QueryResult}
	 */
	setUserBio(bio, userId) {
		const fn = this.formatFunctionLog(`setUserBio`)
		if (!bio) throw new TypeError(`${fn} parameter "bio" cannot be blank.`)
		if (typeof bio !== `string`) throw new TypeError(`${fn} parameter "bio" should be string.`)
		if (bio.length > 156) throw new RangeError(`${fn} parameter "bio" cannot exceed 156 characters!`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		return this._query(`
			UPDATE users
			SET bio = $bio
			WHERE user_id = $userId`
			, `run`
			, { bio: bio, userId: userId }
			, `${fn} Updating bio for USER_ID:${userId}`
		)
	}

	/**
	 * Pull user's gender data
	 * @param {string} userId Target user id
	 * @return {object|null}
	 */
	getUserGender(userId) {
		const fn = this.formatFunctionLog(`getUserGender`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		return this._query(`
            SELECT * FROM user_gender
            WHERE user_id = $userId`
			, `get`
			, { userId: userId }
			, `${fn} fetching gender preference for USER_ID:${userId}`
		)
	}

	/**
	 * Updating user's gender data
	 * @param {string} userId Target user id
	 * @param {string} gender New gender
	 * @return {void}
	 */
	async updateUserGenderToneutral(userId) {
		const fn = this.formatFunctionLog(`updateUserGenderToneutral`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		//	Insert if no data entry exists.
		await this._query(`
	            DELETE FROM user_gender 
				WHERE user_id = $userId`
			, `run`
			, { userId: userId }
			, `${fn} resetting gender preference for USER_ID:${userId}`
		)
		logger.info(`${fn} UPDATE (GENDER: neutral)(USER_ID:${userId}`)
	}

	/**
	 * Updating user's gender data
	 * @param {string} userId Target user id
	 * @param {string} gender New gender
	 * @return {void}
	 */
	async updateUserGender(userId, gender) {
		const fn = this.formatFunctionLog(`updateUserGender`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!gender) throw new TypeError(`${fn} parameter "gender" cannot be blank.`)
		if (![`m`, `f`].includes(gender)) throw new TypeError(`${fn} Gender must be either 'm' or 'f'`)
		//	Insert if no data entry exists.
		const res = {
			insert: await this._query(`
	            INSERT INTO user_gender (user_id, gender)
				SELECT $userId, $gender
				WHERE NOT EXISTS (SELECT 1 FROM user_gender WHERE user_id = $userId)`
				, `run`
				, { userId: userId, gender: gender }
				, `${fn} creating record for gender preference for USER_ID:${userId}`
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_gender
				SET gender = $gender
				WHERE 
					user_id = $userId`
				, `run`
				, { gender: gender, userId: userId }
				, `${fn} updating gender preference for USER_ID:${userId}`
			)
		}
		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${stmtType} (GENDER:${gender})(USER_ID:${userId}`)
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	checkIfThemeOwned(theme, userId, guildId) {
		const fn = this.formatFunctionLog(`checkIfThemeOwned`)
		if (!theme) throw new TypeError(`${fn} parameter "theme" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (![`dark`, `light`].includes(theme)) throw new TypeError(`${fn} Theme must be either "dark" or "light"`)
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme)`
			, `get`
			, { theme: theme, userId: userId, guildId: guildId }
			, `${fn} fetch theme preference for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	GiveThemeToUser(theme, userId, guildId) {
		const fn = this.formatFunctionLog(`GiveThemeToUser`)
		if (!theme) throw new TypeError(`${fn} parameter "theme" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (![`dark`, `light`].includes(theme)) throw new TypeError(`${fn} Theme must be either "dark" or "light"`)
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this.updateInventory({ itemId: theme, value: 1, operation: `+`, userId: userId, guildId: guildId })
	}

	async findCurrentTheme(userId, guildId) {
		const fn = this.formatFunctionLog(`findCurrentTheme`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		// first see if light theme is equiped
		let res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = 4 AND in_use = 1)`
			, `get`
			, { userId: userId, guildId: guildId }
			, `${fn} fetch if light theme is used for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		if (Object.values(res)[0] == 1) return `light`
		// second see if dark theme is equiped
		res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = 3 AND in_use = 1)`
			, `get`
			, { userId: userId, guildId: guildId }
			, `${fn} fetch if dark theme is used for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		if (Object.values(res)[0] == 1) return `dark`
		return `none`
	}

	setTheme(theme, userId, guildId) {
		const fn = this.formatFunctionLog(`setTheme`)
		if (!theme) throw new TypeError(`${fn} parameter "theme" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (![`dark`, `light`].includes(theme)) throw new TypeError(`${fn} Theme must be either "dark" or "light"`)
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
			, { theme: themeToSet, userId: userId, guildId: guildId }
			, `${fn} Set in use theme for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		this._query(`UPDATE user_inventories SET in_use = 0 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`
			, `run`
			, { theme: themeToUnset, userId: userId, guildId: guildId }
			, `${fn} Unset in use for old theme for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		return
	}

	/**
	 * Pull user's language/locale data
	 * @param {string} userId target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserLocale(userId) {
		const fn = this.formatFunctionLog(`getUserLocale`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		return this._query(`
			SELECT lang
			FROM users
			WHERE user_id = $userId`
			, `get`
			, { userId: userId }
			, `${fn} fetch locale for USER_ID:${userId}`
		)
	}

	/**
	 * Updating the timestamp for reputation giver.
	 * @param {string} userId target user's discord id
	 * @param {string} guildId target user's discord id
	 * @returns {QueryResult}
	 */
	updateReputationGiver(userId, guildId) {
		const fn = this.formatFunctionLog(`updateReputationGiver`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		return this._query(`
			UPDATE user_reputations 
			SET last_giving_at = CURRENT_TIMESTAMP
			WHERE user_id = $userId 
            AND guild_id = $guildId`
			, `run`
			, { userId: userId, guildId: guildId }
			, `${fn} update last reputation give for USER_ID:${userId} in GUILD_ID:${guildId}`
		)
	}
}

class SystemUtils extends DatabaseUtils {

	constructor(client) {
		super(client)
		this.fnClass = `SystemUtils`
	}

	/**
	 * Records command query/usage everytime user uses it.
	 * @param {Object} @requires [guild_id] The discord guild's id
	 * @param {Object} @requires [user_id] The discord user's id
	 * @param {Object} @requires [command_alias] The command name
	 * @param {Object} @requires [resolved_in=`0ms`] Time took to complete command run
	 * @returns {QueryResult}
	 */
	recordsCommandUsage({ guild_id, user_id, command_alias, resolved_in = `0ms` }) {
		const fn = this.formatFunctionLog(`recordsCommandUsage`)
		if (!guild_id) throw new TypeError(`${fn} parameter "guild_id" cannot be blank.`)
		if (!user_id) throw new TypeError(`${fn} parameter "user_id" cannot be blank.`)
		if (!command_alias) throw new TypeError(`${fn} parameter "command_alias" cannot be blank.`)
		if (!resolved_in) throw new TypeError(`${fn} parameter "resolved_in" cannot be blank.`)
		return this._query(`
			INSERT INTO commands_log (
				registered_at, 
				user_id, 
				guild_id, 
				command_alias, 
				resolved_in
			)
			VALUES (CURRENT_TIMESTAMP, $userId, $guildId, $commandAlias, $resolvedIn)`
			, `run`
			, { userId: user_id, guildId: guild_id, commandAlias: command_alias, resolvedIn: resolved_in }
			, `${fn} Log command usage`
		)
	}

	/**
	 * Pull the total of command usage.
	 * @return {object}
	 */
	async getTotalCommandUsage() {
		const fn = this.formatFunctionLog(`getTotalCommandUsage`)
		const key = `TOTAL_CMD_USAGE`
		//  Retrieve from cache if available
		const cache = await this.getCache(key)
		if (cache !== null) return JSON.parse(cache)
		//  Else, hit db
		const res = await this._query(`
			SELECT COUNT(command_alias) AS 'total'
			FROM commands_log`, `get`, [], `${fn} fetch total commands ran`
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
		return timestamp
	}
}

class GuildUtils extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `GuildUtils`
	}

	/**
	 * Fetch all the available guild configurations.
	 * @param {Array} guildIds
	 * @returns {QueryResult}
	 */
	async getAllGuildsConfigurations(guildIds) {		
		const fn = this.formatFunctionLog(`getAllGuildsConfigurations`)
		if (!guildIds) throw new TypeError(`${fn} property "guildIds" must be a guild snowflake or array of guild snowflakes.`)
		if (typeof(guildIds) != `object` && !Array.isArray(guildIds)) throw new TypeError(`${fn} property "guildIds" must be a Array.`)
		const guildsInCache = guildIds.join(`,`)
		return this._query(`
			SELECT * 
			FROM guild_configurations
			WHERE guild_id IN ($guildId)`
			, `all`, {guildId: guildsInCache}, `${fn} fetch all guild configs`
		)
	}

	/**
	 * Fetch all the registered servers in affiliate table
	 * @return {QueryResult} 
	 */
	async getAffiliates() {
		const fn = this.formatFunctionLog(`getAffiliates`)
		return this._query(`
			SELECT *
			FROM affiliates`
			, `all`
			, []
			, `${fn} Fetching affiliates list`
		)
	}

	/**
	 * Registering guild to the list of guilds 
	 * @param {Object} [guild.id] to be registered from.
	 * @param {Object} [guild.name] to be registered from.
	 * @returns {QueryResult}
	 */
	registerGuild(guild = {}) {
		const fn = this.formatFunctionLog(`registerGuild`)
		if (!guild || typeof guild !== `object`) throw new TypeError(`${fn} property "guild" must be a guild object and non-faulty value.`)
		return this._query(`
			INSERT INTO guilds (guild_id, name)
			SELECT $guildId, $guildName
			WHERE NOT EXISTS (SELECT 1 FROM guilds WHERE guild_id = $guildId)`
			, `run`
			, { guildId: guild.id, guildName: guild.name }
			, `${fn} Create record for new guild`
		)
	}

	/**
	 * Insert or update an existing guild config values
	 * @param {guildConfigurations} obj
	 * @returns {QueryResult}
	 */
	async updateGuildConfiguration({ configCode = null, guild = null, customizedParameter = null, setByUserId = null, cacheTo = {} }) {
		const fn = this.formatFunctionLog(`updateGuildConfiguration`)
		if (!configCode || typeof configCode !== `string`) throw new TypeError(`${fn} property "configCode" must be string and non-faulty value.`)
		if (!guild || typeof guild !== `object`) throw new TypeError(`${fn} property "guild" must be a guild object and non-faulty value.`)
		if (!customizedParameter) throw new TypeError(`${fn} parameter "customizedParameter" cannot be blank.`)
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
				, `${fn} insert new guild config`
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
			   UPDATE guild_configurations
			   SET 
				   customized_parameter = $parameter,
				   set_by_user_id = $userId,
				   updated_at = CURRENT_TIMESTAMP
			   WHERE 
				   config_code = $configCode
				   AND guild_id = $guildId`
				, `run`
				, { parameter: parsedValueParameter, userId: setByUserId, configCode: configCode, guildId: guild.id }
				, `${fn} update guild config`
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
		const fn = this.formatFunctionLog(`getCurrentTimestamp`)
		const res = await this._query(`SELECT CURRENT_TIMESTAMP`, `get`, [], `${fn} get timestamp in SQL format`)
		return res.CURRENT_TIMESTAMP
	}

	/**
	 * Delete a guild's config from guild_configurations table
	 * @param {string} [configCode] the identifier code for a configuration/module
	 * @param {string} [guildId] target guild 
	 * @returns {boolean}
	 */
	async deleteGuildConfiguration(configCode, guildId) {
		const fn = this.formatFunctionLog(`deleteGuildConfiguration`)
		if (!configCode || typeof configCode !== `string`) throw new TypeError(`${fn} property "configCode" must be a string-typed ID`)
		if (!guildId || typeof guildId !== `string`) throw new TypeError(`${fn} property "guildId" must be a string-typed ID`)
		//  Run entry
		const res = await this._query(`
			DELETE FROM guild_configurations
			WHERE
				config_code = $configCode
				AND guild_id = $guildId`
			, `run`
			, { configCode: configCode, guildId: guildId }
			, `${fn}Performing config(${configCode}) deletion for GUILD_ID:${guildId}`
		)
		const type = res.changes ? `DELETED` : `NO_CHANGES`
		logger.info(`${fn} ${type} (CONFIG_CODE:${configCode})(GUILD_ID:${guildId})`)
		return true
	}
}

class Relationships extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `Relationships`
	}

	/**
	 * Pull available relationship types
	 * @returns {QueryResult}
	 */
	getAvailableRelationships() {
		const fn = this.formatFunctionLog(`getAvailableRelationships`)
		return this._query(`
			SELECT * FROM relationships
			WHERE name IN ('parent', 'kid', 'old sibling', 'young sibling', 'couple', 'bestfriend') ORDER BY relationship_id ASC`
			, `all`, [], `${fn} fetch all ralationship options`
		)
	}

	/**
	 * Removing user's relationship
	 * @param {string} [userA] Author's user id.
	 * @param {string} [userB] Target user's id to be assigned.
	 * @returns {QueryResult}
	 */
	removeUserRelationship(userA, userB) {
		const fn = this.formatFunctionLog(`removeUserRelationship`)
		if (!userA) throw new TypeError(`${fn} parameter "userA" cannot be blank.`)
		if (!userB) throw new TypeError(`${fn} parameter "userB" cannot be blank.`)
		return this._query(`
            DELETE FROM user_relationships
            WHERE 
            	user_id_A = ?
				AND user_id_B = ?`
			, `run`
			, [userA, userB]
			, `${fn} Removing ${userA} and ${userB} relationship.`
		)
	}

	/**
	 * Fetch metadata of a relationship type.
	 * @param {string} name Target relationship name
	 * @return {object|null}
	 */
	getRelationship(name) {
		const fn = this.formatFunctionLog(`getRelationship`)
		if (!name) throw new TypeError(`${fn} parameter "name" cannot be blank.`)
		return this._query(`
            SELECT *
            FROM relationships
            WHERE name = $name`
			, `get`
			, { name: name }
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
	async setUserRelationship(userA, userB, relationshipId, guildId) {
		const fn = this.formatFunctionLog(`setUserRelationship`)
		if (!userA) throw new TypeError(`${fn} parameter "userA" cannot be blank.`)
		if (!userB) throw new TypeError(`${fn} parameter "userB" cannot be blank.`)
		if (!relationshipId) throw new TypeError(`${fn} parameter "relationshipId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
	            INSERT INTO user_relationships (user_id_A, user_id_B, relationship_id, guild_id)
				SELECT $userA, $userB, $relationshipId, $guildId
				WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id_A = $userA AND user_id_B = $userB)`
				, `run`
				, { userA: userA, userB: userB, relationshipId: relationshipId, guildId: guildId }
				, `${fn} Registering new relationship for ${userA} and ${userB} in GUILD_ID ${guildId}`
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_relationships
				SET relationship_id = $relationshipId
				WHERE 
					user_id_A = $userA
					AND user_id_B = $userB`
				, `run`
				, { relationshipId: relationshipId, userA: userA, userB: userB }
				, `${fn} updating relationship for USER_ID:${userA} and USER_ID:${userB} in GUILD_ID:${guildId}`
			)
		}

		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${stmtType} (REL_ID:${relationshipId})(USER_A:${userA} WITH USER_B:${userB})`)
		return true
	}
}

class AutoResponder extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `AutoResponder`
	}

	/**
	 * Retrieve all guilds that have auto responders registered.
	 * @return {QueryResult}
	 */
	getGuildsWithAutoResponders() {
		const fn = this.formatFunctionLog(`getGuildsWithAutoResponders`)
		return this._query(`
			SELECT DISTINCT guild_id
			FROM autoresponders`
			, `all`
			, []
			, `${fn} fetch all autoresponders`
		)
	}

	/**
	 * Retrieving all the registered ARs from specific guild.
	 * @param {string} [guildId] Target guild.
	 * @param {boolean} [fetchCache=true] Toggle false to make it always fetching from database.
	 * @return {QueryResult}
	 */
	async getAutoResponders(guildId, fetchCache = true) {
		const fn = this.formatFunctionLog(`getAutoResponders`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (typeof (fetchCache) !== `boolean`) throw new TypeError(`${fn} parameter "fetchCache" must be a boolean.`)
		//  Check in cache
		const cacheID = `REGISTERED_AR@${guildId}`
		if (fetchCache && await this.isCacheExist(cacheID)) return JSON.parse(await this.getCache(cacheID))
		return this._query(`
			SELECT *
			FROM autoresponders
			WHERE guild_id = $guildId`
			, `all`
			, { guildId: guildId }
			, `${fn} fetch autoresponders for GUILD_ID:${guildId}`
		)
	}

	/**
	 * Registering new autoresponder to specific guild.
	 * @param {AutoresponderMetadata} [meta={}] The AR metadata to be registered.
	 * @return {QueryResult}
	 */
	async registerAutoResponder({ guildId = ``, userId = ``, trigger = ``, response = `` }) {
		const fn = this.formatFunctionLog(`registerAutoResponder`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!trigger) throw new TypeError(`${fn} parameter "trigger" cannot be blank.`)
		if (!response) throw new TypeError(`${fn} parameter "response" cannot be blank.`)
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
			VALUES($guildId, $userId, $trigger, $response)`
			, `run`
			, { guildId: guildId, userId: userId, trigger: trigger, response: response }
			, `${fn} Inserting new AR for GUILD_ID:${guildId}`
		)
		const ARmeta = (await this._query(`
			SELECT *
			FROM autoresponders
			WHERE guild_id = $guildId
			ORDER BY ar_id DESC`
			, `all`
			, { guildId: guildId }
			, `${fn} fetch AR metadata`
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
	 * @param {string} [guildId] Target guild.
	 * @return {QueryResult}
	 */
	async deleteAutoResponder(id, guildId) {
		const fn = this.formatFunctionLog(`deleteAutoResponder`)
		if (!id) throw new TypeError(`${fn} parameter "id" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
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
				ar_id = $arId
				AND guild_id = $guildId`
			, `run`
			, { arId: id, guildId: guildId }
			, `${fn} Deleting AR with ID:${id} from GUILD_ID:${guildId}`
		)
	}

	/**
	 * Deletes all the registered ARs from specific guild.
	 * @param {string} [guildId=``] Target guild.
	 * @return {QueryResult}
	 */
	clearAutoResponders(guildId) {
		const fn = this.formatFunctionLog(`clearAutoResponders`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		//  Clear ARs in cache
		this.clearCache(`REGISTERED_AR@${guildId}`)
		return this._query(`
			DELETE FROM autoresponders
			WHERE guild_id = $guildId`
			, `run`
			, [guildId]
			, `${fn} Deleting all ARs from GUILD_ID:${guildId}`
		)
	}
}

class DurationalBuffs extends DatabaseUtils {
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
		const fn = this.formatFunctionLog(`getSavedUserDurationalBuffs`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		return this._query(`
            SELECT *
            FROM user_durational_buffs
            WHERE user_id = $userId`
			, `all`
			, { userId: userId }
			, `${fn} fetch durantional buffs for USER_ID:${userId}`
		)
	}

	/**
	 * Fetch all the saved durational buffs.
	 * @return {object}
	 */
	getSavedDurationalBuffs() {
		const fn = this.formatFunctionLog(`getSavedUserDurationalBuffs`)
		return this._query(`
            SELECT *
            FROM user_durational_buffs`
			, `all`, [], `${fn} fetch all durantional buffs`
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
		const fn = this.formatFunctionLog(`registerUserDurationalBuff`)
		if (!buffType) throw new TypeError(`${fn} parameter "buffType" cannot be blank.`)
		if (!name) throw new TypeError(`${fn} parameter "name" cannot be blank.`)
		if (!multiplier) throw new TypeError(`${fn} parameter "multiplier" cannot be blank.`)
		if (!duration) throw new TypeError(`${fn} parameter "duration" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		this._query(`
            SELECT COUNT(*) AS instance
            FROM user_durational_buffs
            WHERE
                type = $buffType
                AND name = $name
                AND multiplier = $multiplier
                AND user_id = $userId
                AND guild_id = $guildId`
			, `get`
			, { buffType: buffType, name: name, multiplier: multiplier, userId: userId, guildId: guildId }
			, `${fn} Fetch how many durantional buffs there are for USER_ID:${userId} in GUILD_ID:${guildId}`
		).then(res => {
			//  Update duration
			if (res.instance > 0) return this._query(`
                UPDATE user_durational_buffs
                SET registered_at = CURRENT_TIMESTAMP
                WHERE
                    type = $buffType
					AND name = $name
					AND multiplier = $multiplier
					AND user_id = $userId
					AND guild_id = $guildId`
				, `run`
				, { buffType: buffType, name: name, multiplier: multiplier, userId: userId, guildId: guildId }
				, `${fn} Update durantional buff for USER_ID:${userId} in GUILD_ID:${guildId}`
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
                VALUES($buffType, $name, $multiplier, $duration, $userId, $guildId)`
				, `run`
				, { buffType: buffType, name: name, multiplier: multiplier, duration: duration, userId: userId, guildId: guildId }
				, `${fn} Insert durantional buff for USER_ID:${userId} in GUILD_ID:${guildId}`
			)
		})
	}

	/**
	 * Deleting specific user's durational buff.
	 * @param {number} buffId
	 * @return {void}
	 */
	removeUserDurationalBuff(buffId) {
		const fn = this.formatFunctionLog(`removeUserDurationalBuff`)
		if (!buffId) throw new TypeError(`${fn} parameter "buffId" cannot be blank.`)
		this._query(`
            DELETE FROM user_durational_buffs
            WHERE buff_id = $buffId`
			, `run`
			, { buffId: buffId }
			, `${fn} Delete durational buff`
		)
			.then(res => {
				if (res.changes > 0) logger.debug(`${fn} BUFF_ID:${buffId} has finished and omited.`)
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
		const fn = this.formatFunctionLog(`getUserDurationalBuffId`)
		if (!buffType) throw new TypeError(`${fn} parameter "buffType" cannot be blank.`)
		if (!name) throw new TypeError(`${fn} parameter "name" cannot be blank.`)
		if (!multiplier) throw new TypeError(`${fn} parameter "multiplier" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		const res = await this._query(`
            SELECT buff_id
            FROM user_durational_buffs
            WHERE
                type = $buffType
                AND name = $name
                AND multiplier = $multiplier
                AND user_id = $userId
                AND guild_id = $guildId`
			, `get`
			, { buffType: buffType, name: name, multiplier: multiplier, userId: userId, guildId: guildId }
			, `${fn} fetch durational buff id`
		)
		return res.buff_id || null
	}
}

class CustomRewards extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `CustomRewards`
	}

	/**
	 * Retrieve all reward packages for specific Discord guild
	 * @param {string} guildId 
	 * @returns {Promise}
	 */
	getRewardAmount(guildId) {
		const fn = this.formatFunctionLog(`getRewardAmount`)
		return this._query(`SELECT * FROM custom_rewards WHERE guild_id = $guildId`
			, `all`
			, { guild_id: guildId }
			, `${fn} Retrieving all packages for guild: ${guildId}`
		)
	}

	/**
	 * Write the package data to the DB
	 * @param {string} guildId target guild
	 * @param {string} userId target user's id
	 * @param {string} rewardBlob the package as a stringified JSON
	 * @param {string} rewardName the package name
	 * @returns {Promise}
	 */
	recordReward(guildId, userId, rewardBlob, rewardName) {
		const fn = this.formatFunctionLog(`recordReward`)
		return this._query(` INSERT INTO custom_rewards (registered_at, guild_id, set_by_user_id, reward, reward_name)
		VALUES (CURRENT_TIMESTAMP, $guildId, $user_id, $reward, $rewardName)`
			, `run`
			, { guild_id: guildId, user_id: userId, reward: rewardBlob, rewardName: rewardName }
			, `${fn} Inserting record for new package for guild: ${guildId}`
		)
	}

	/**
	 * Delete package from DB
	 * @param {string} guildId target guild
	 * @param {string} rewardName package name
	 * @returns {Promise}
	 */
	deleteReward(guildId, rewardName) {
		const fn = this.formatFunctionLog(`deleteReward`)
		return this._query(` DELETE FROM custom_rewards WHERE guild_id = $guildId AND reward_name = $rewardName`
			, `run`
			, { guild_id: guildId, rewardName: rewardName }
			, `${fn} deleting package with name: ${rewardName} from guild: ${guildId}`
		)
	}
}

class Covers extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `Covers`
	}

	/**
	 * Detach user's covers. Aftewards, combined with `this.useItem()`
	 * @param {string} [userId] target user's id.
	 * @param {string} [guidId] target guild
	 * @returns {QueryResult}
	 */
	async detachCovers(userId, guildId) {
		const fn = this.formatFunctionLog(`detachCovers`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		const res = await this._query(`
    		UPDATE user_inventories
    		SET in_use = 0
    		WHERE 
    			user_id = $userId
    			AND guild_id = $guildId
    			AND item_id IN (
    				SELECT item_id
    				FROM items
    				WHERE type_id = 1 
    			)`
			, `run`
			, { userId: userId, guildId: guildId }
			, `${fn} Detaching covers from USER_ID:${userId} in GUILD_ID:${guildId}`
		)
		return res
	}

	/**
	 * Applying new cover to user's profile.
	 * @param {number} [coverId] target cover to be applied.
	 * @param {string} [userId] target user's id.
	 * @param {string} [guidId] target guild
	 * @returns {QueryResult}
	 */
	async applySelfUploadCover(coverId, userId, guildId) {
		const fn = this.formatFunctionLog(`applySelfUploadCover`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
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
				, `${fn} Insert self upload cover record`
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_self_covers
				SET 
					cover_id = $coverId,
					registered_at = CURRENT_TIMESTAMP
				WHERE 
					user_id = $userId 
					AND guild_id = $guildId`
				, `run`
				, { coverId: coverId, userId: userId, guildId: guildId }
				, `${fn} update self upload cover record`
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
	deleteSelfUploadCover(userId, guildId) {
		const fn = this.formatFunctionLog(`deleteSelfUploadCover`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter 'guildId' cannot be blank.`)
		return this._query(`
			DELETE FROM user_self_covers
			WHERE
				user_id = $userId
				AND guild_id = $guildId`
			, `run`
			, { userId: userId, guildId: guildId }
			, `${fn} Performing self-upload cover deletion on USER_ID:${userId} on GUILD_ID:${guildId}`
		)
	}

	/**
	 * Applying new cover to user's profile.
	 * @param {number} [coverId] target cover to be applied.
	 * @param {string} [userId] target user's id.
	 * @param {string} [guidId] target guild
	 * @returns {QueryResult}
	 */
	async applyCover(coverId, userId, guildId) {
		const fn = this.formatFunctionLog(`applyCover`)
		if (!coverId) throw new TypeError(`${fn} parameter 'coverId' cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter 'userId' cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter 'guildId' cannot be blank.`)
		const res = await this._query(`
    		UPDATE user_inventories
    		SET in_use = 1
    		WHERE 
    			item_id = $coverId
    			AND user_id = $userId
    			AND guild_id = $guildId`
			, `run`
			, { coverId: coverId, userId: userId, guildId: guildId }
			, `${fn} Applying cover[${coverId}] for USER_ID${userId} in GUILD_ID:${guildId}`
		)
		return res
	}
}

class Shop extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `Shop`
	}

	/**
	 * Fetch items from `item_gacha` table.
	 * @returns {QueryResult}
	 */
	async getGachaRewardsPool() {
		const fn = this.formatFunctionLog(`getGachaRewardsPool`)
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
			, `all`, [], `${fn} fetch gacha pool`
		)
		//  Cache rewards pool for 1 hour
		this.redis.set(cacheId, JSON.stringify(res), `EX`, 60 * 60)
		return res
	}

	/**
	 * Registering new item into database
	 * @param {Object} item
	 * @return {QueryResult}
	 */
	registerItem(item) {
		const fn = this.formatFunctionLog(`registerItem`)
		const validKeys = [
			`name`, `description`, `alias`, `typeId`, `rarityId`, `bind`, `ownedByGuildId`, `responseOnUse`, `usable`
		]
		if (!item) throw new TypeError(`${fn} parameter "item" cannot be blank.`)
		if (typeof (item) === `object` && this.arrayEquals(Object.keys(item), validKeys)) new TypeError(`${fn} parameter "context" must be a object and include the following: name, description, alias, typeId, rarityId, bind, ownedByGuildId, responseOnUse, usable.`)
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
            VALUES($name, $description, $alias, $typeId, $rarityId, $bind, $ownedByGuildId, $responseOnUse, $usable)`
			, `run`
			, {
				name: item.name,
				description: item.description,
				alias: item.alias,
				typeId: item.typeId,
				rarityId: item.rarityId,
				bind: item.bind,
				ownedByGuildId: item.ownedByGuildId,
				responseOnUse: item.responseOnUse,
				usable: item.usable
			}
			, `${fn} Create record for new item`
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
		const fn = this.formatFunctionLog(`registerGuildShopItem`)
		if (!itemId) new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!guildId) new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!quantity) new TypeError(`${fn} parameter "quantity" cannot be blank.`)
		if (!price) new TypeError(`${fn} parameter "price" cannot be blank.`)
		return this._query(`
            INSERT INTO shop(item_id, guild_id, quantity, price)
            VALUES($itemId, $guildId, $quantity, $price)`
			, `run`
			, {itemId:itemId, guildId:guildId, quantity:quantity, price:price}
			, `${fn} register item with a GUILD_ID:${guildId}`
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
		const fn = this.formatFunctionLog(`registerItemEffects`)
		if (!itemId) new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!guildId) new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!effectRefId) new TypeError(`${fn} parameter "effectRefId" cannot be blank.`)
		if (!parameters) new TypeError(`${fn} parameter "parameters" cannot be blank.`)
		return this._query(`
            INSERT INTO item_effects(
                item_id,
                guild_id,
                effect_ref_id,
                parameter)
            VALUES($itemId, $guildId, $effectRefId, $parameters)`
			, `run`
			, {itemId:itemId, guildId:guildId, effectRefId:effectRefId, parameters:JSON.stringify(parameters)}
			, `${fn} register new effect for item`
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
		const fn = this.formatFunctionLog(`updateItemMetadata`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!targetProperty) throw new TypeError(`${fn} parameter "targetProperty" cannot be blank.`)
		if (!param) throw new TypeError(`${fn} parameter "param" cannot be blank.`)
		const validColumns = [`item_id`,`name`,`description`,`alias`,`type_id`,`rarity_id`,`bind`,`usable`,`response_on_use`, `owned_by_guild_id`]
		if (!validColumns.includes(targetProperty)) throw new TypeError(`${fn} parameter "targetProperty" must be one for the following: ${validColumns.join(`, `)}`)
		this._query(`
            UPDATE items
            SET ${targetProperty} = $param
            WHERE item_id = $itemId`
			, `run`
			, {param:param, itemId:itemId}
			, `${fn} Update item details`
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
		const fn = this.formatFunctionLog(`updateShopItemMetadata`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!targetProperty) throw new TypeError(`${fn} parameter "targetProperty" cannot be blank.`)
		if (!param) throw new TypeError(`${fn} parameter "param" cannot be blank.`)
		const validColumns = [`item_id`,`guild_id`,`quantity`,`price`]
		if (!validColumns.includes(targetProperty)) throw new TypeError(`${fn} parameter "targetProperty" must be one for the following: ${validColumns.join(`, `)}`)
		
		this._query(`
            UPDATE shop
            SET ${targetProperty} = $param
            WHERE item_id = $itemId`
			, `run`
			, {param:param, itemId:itemId}
			, `${fn} update item details in shop`
		)
	}

	/**
	* Remove an item from the shops table
	* @param {number} [itemId] target item to search.
	* @returns {QueryResult}
	*/
	removeGuildShopItem(itemId) {
		const fn = this.formatFunctionLog(`removeGuildShopItem`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		return this._query(`
			DELETE FROM shop
			WHERE item_id = $itemId`
			, `run`
			, { itemId: itemId }
			, `${fn} Delete item from guild shop`
		)
	}

	/**
	 * Pull any item metadata from `items` table. Supports dynamic search.
	 * @param {ItemKeyword} keyword ref to item id, item name or item alias.
	 * @param {string} [guildId=null] Limit search to specific guild's owned items only. Optional. 
	 * @returns {QueryResult}
	 */
	getItem(keyword, guildId) {
		const fn = this.formatFunctionLog(`getItem`)
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
		if (keyword === null && typeof guildId === `string`) return this._query(str + ` WHERE owned_by_guild_id = $guildId`
			, `all`
			, {guildId:guildId}
			, `${fn} fetch all items for GUILD_ID:${guildId}`
		)
		//  Do single fetch on specific guild
		if (keyword && typeof guildId === `string`) return this._query(str + `
            WHERE 
                owned_by_guild_id = $guildId
                AND lower(items.name) = lower($keyword)`
			, `get`
			, { keyword: keyword, guildId: guildId }
			, `${fn} fetch single item for GUILD_ID:${guildId}`
		)
		return this._query(str + ` 
			WHERE 
				items.item_id = $keyword
				OR lower(items.name) = lower($keyword)
				OR lower(items.alias) = lower($keyword)
			LIMIT 1`
			, `get`
			, { keyword: keyword }
			, `${fn} fetch single item by item name:${keyword}`
		)
	}

	/**
	 * Fetch all the registered purchasable items in target server.
	 * @param {string} guildId
	 * @return {object}
	 */
	getGuildShop(guildId) {
		const fn = this.formatFunctionLog(`getGuildShop`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		return this._query(`
            SELECT *
            FROM shop
            WHERE guild_id = $guildId`
			, `all`
			, {guildId:guildId}
			, `${fn} fetch shop for GUILD_ID:${guildId}`
		)
	}

	/**
	 * Subtract item's supply from shop table.
	 * @param {number} itemId
	 * @param {number} [amount=1] Amount to subtract
	 * @return {void}
	 */
	subtractItemSupply(itemId, amount = 1) {
		const fn = this.formatFunctionLog(`subtractItemSupply`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		this._query(`
            UPDATE shop
            SET quantity = quantity - $amount
            WHERE item_id = $itemId`
			, `run`
			, {amount:amount, itemId:itemId}
			, `${fn} update item amount in shop`
		)
	}

	/**
	 * Fetch registered effects for specified item.
	 * @param {number} itemId
	 * @return {object}
	 */
	getItemEffects(itemId) {
		const fn = this.formatFunctionLog(`getItemEffects`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		return this._query(`
            SELECT *
            FROM item_effects
            WHERE item_id = $itemId`
			, `all`
			, {itemId:itemId}
			, `${fn} fetch item effects for ITEM_ID:${itemId}`
		)
	}

}

class Quests extends DatabaseUtils {
	constructor(client) {
		super(client)
		this.fnClass = `Quests`
	}

	async registerQuest(reward_amount, name, description, correct_answer) {
		const fn = this.formatFunctionLog(`registerQuest`)
		if (!reward_amount) new Error(`${fn} The parameter 'reward_amount' is missing, it must be an Integer`)
		if (!name) new Error(`${fn} The parameter 'name' is missing, it must be an String`)
		if (!description) new Error(`${fn} The parameter 'description' is missing, it must be an String`)
		if (!correct_answer) new Error(`${fn} The parameter 'correct_answer' is missing, it must be an String`)
		if (typeof (reward_amount) != Number) new TypeError(`${fn} The parameter 'reward_amount' is missing, it must be an Integer`)
		if (typeof (name) != String) new TypeError(`${fn} The parameter 'name' is missing, it must be an String`)
		if (typeof (description) != String) new TypeError(`${fn} The parameter 'description' is missing, it must be an String`)
		if (typeof (correct_answer) != String) new TypeError(`${fn} The parameter 'correct_answer' is missing, it must be an String`)
		return await this._query(`
		INSERT INTO quests(
			reward_amount,
			name,
			description,
			correct_answer
		)
		VALUES($reward_amount, $name, $description,	$correct_answer)`, `run`, { reward_amount: reward_amount, name: name, description: description, correct_answer: correct_answer }, `${fn} Registered new quest`)
	}

	/**
	   * Pull all the available quests in quests master table
	   * @return {QueryResult}
	   */
	async getAllQuests() {
		const fn = this.formatFunctionLog(`getAllQuests`)
		const cacheId = `CACHED_QUESTS_POOL`
		const cache = await this.redis.get(cacheId)
		if (cache !== null) return JSON.parse(cache)
		const res = await this._query(`
			SELECT *
			FROM quests`
			, `all`
			, []
			, `${fn} Fetching all the available quests in master quests table`
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
	updateUserNextActiveQuest(userId, guildId, nextQuestId) {
		const fn = this.formatFunctionLog(`updateUserNextActiveQuest`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!nextQuestId) throw new TypeError(`${fn} parameter "nextQuestId" cannot be blank.`)
		return this._query(`
			UPDATE user_quests
			SET next_quest_id = $nextQuestId
			WHERE
				user_id = $userId
				AND guild_id = $guildId`
			, `run`
			, { nextQuestId: nextQuestId, userId: userId, guildId: guildId }
			, `${fn} Updating next active quest ID for ${userId}@${guildId}`
		)
	}

	/**
	   * Update user's quest data after completing a quest
	   * @param {string} [userId] target user's data to be updated
	   * @param {string} [guildId] target guild where user's data going to be updated
	   * @param {string} [nextQuestId] quest_id to be supplied on user's next quest take
	   * @return {QueryResult}
	   */
	updateUserQuest(userId, guildId, nextQuestId) {
		const fn = this.formatFunctionLog(`updateUserQuest`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!nextQuestId) throw new TypeError(`${fn} parameter "nextQuestId" cannot be blank.`)
		return this._query(`
			UPDATE user_quests
			SET 
				updated_at = CURRENT_TIMESTAMP,
				next_quest_id = $nextQuestId
			WHERE
				user_id = $userId
				AND guild_id = $guildId`
			, `run`
			, { nextQuestId: nextQuestId, userId: userId, guildId: guildId }
			, `${fn} Updating ${userId}@${guildId} quest data`
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
	recordQuestActivity(questId, userId, guildId, answer) {
		const fn = this.formatFunctionLog(`updateUserQuest`)
		if (!questId) throw new TypeError(`${fn} parameter "questId" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		if (!answer) throw new TypeError(`${fn} parameter "answer" cannot be blank.`)
		return this._query(`
			INSERT INTO quest_log(
				guild_id,
				quest_id,
				user_id,
				answer
			)
			VALUES($guildId, $questId, $userId, $answer)`
			, `run`
			, { questId: questId, userId: userId, guildId: guildId, answer: answer }
			, `${fn} Storing ${userId}@${guildId} quest's activity to quest_log table`
		)
	}
}

/* class Template extends DatabaseUtils{
	constructor(client){
		super(client)
	}
	
} */

module.exports = Database