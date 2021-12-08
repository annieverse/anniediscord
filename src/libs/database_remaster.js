const SqliteClient = require(`better-sqlite3`)
const Redis = require(`async-redis`)
const logger = require(`pino`)({
	name: `DATABASE`,
	level: `debug`
})
const getBenchmark = require(`../utils/getBenchmark`)
const fs = require(`fs`)
const {
	join
} = require(`path`)
const relationshipPairs = require(`../config/relationshipPairs.json`)

/**
 * Centralized Class for handling various database tasks 
 * for Annie.
 */
class Database {
	/**
	 * Options to be supplied to `registerItem()` parameters
	 * @typedef {object} item
	 * @property {string} name Name of the item
	 * @property {string} description Description of the item
	 * @property {string} alias Shorter-name of the item for referencing asset
	 * @property {number} typeId The type for current item
	 * @property {string} rarityId The rarity type for current item
	 * @property {number} bind Allows the item to be tradable or not
	 * @property {string} owned_by_guild_id Guild/server-specific item
	 * @property {string|null} response_on_use Custom response upon use
	 * @property {number} usable Allows the item to be used or not
	 */

	/**
	 * Options to be supplied to `this.updateInventory()` parameters
	 * @typedef {Object} itemsMetadata
	 * @property {number} [itemId] The item's id. Refer to `items` table
	 * @property {number} [value=0] Amount to be stored.
	 * @property {string} [operation=`+`] `+, -, *, /` is the available operation.
	 * @property {string} [userId] target user's discord id
	 */

	/**
	 * Keyword used to perform searchString in item database lookup.
	 * The keyword can be an `item id`, `item name` or `item alias`.
	 * Below is the example for each keyword type:
	 * * Item Id : 0, 1, 2, ... 9999
	 * * Item Name : "Default Cover", "Spring Badge", "Chocolate Box"
	 * * item Alias : "defaultcov", "spring_badge", "chocolate_box"
	 * @typedef {string} ItemKeyword
	 */

	/**
	 * Required metadata to register new entry for `commands_log` table
	 * @typedef {object} CommandUsage
	 * @property {string} [user_id=``] user id who uses it
	 * @property {string} [guild_id=``] the guild id where user uses the command
	 * @property {string} [command_alias=``] used command name/alias
	 * @property {string} [resolved_in=`0ms`] the time taken during command execution
	 */

	/**
	 * Returned result after executing `this._query()`
	 * Rows will be stored in the root level of the object or array (depends if you use `get` or `all` method)
	 * So for as example in the `all` method:
	 * ```
	 * [
	 *  {"1": 1},
	 *  stmt: `SELECT 1 FROM user`
	 * ]
	 * ```
	 * You will need Array.map() in order to access the data.
	 * By default the retuned result will include the given stmt.
	 * Although for some cases, stmt isn't needed. You can ommit the prop by toggling the
	 * fifth parameter in `this._query()` if you want.
	 * @typedef {object} QueryResult
	 * @property {string} [stmt] The item's id. Refer to `items` table
	 */


	/**
	 * [INTERNAL] Start
	 */
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
		this.client = new SqliteClient(path, {
			timeout: 10000
		})
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
	 * 	Standardized method for executing sql query
	 * 	@param {string} [stmt=``] sql statement
	 * 	@param {string} [type=`get`] `get` for single result, `all` for multiple result
	 * 	and `run` to execute statement such as UPDATE/INSERT/CREATE.
	 * 	@param {array} [supplies=[]] parameters to be supplied into sql statement.
	 *  @private
	 *  @returns {QueryResult|null}
	 */
	async _query(stmt = ``, type = `get`, supplies = [], log = null) {
		// console.log(stmt)
		// console.log(type)
		// console.log(supplies)
		// console.log(log)
		//	Return if no statement has found
		if (!stmt) return null
		const que = this.client.prepare(stmt)
		const fn = this.client.transaction(params => que[type](params))
		const result = await fn(supplies)
		if (log) logger.info(log)
		// console.log(`\nHI`)
		// console.log(log)
		if (!result) return null
		return result
	}
	/**
	 * Retrieve all guilds that have auto responders registered.
	 * @return {QueryResult}
	 */
	getGuildsWithAutoResponders() {
		return this._query(`
			SELECT DISTINCT guild_id
			FROM autoresponders`, `all`, [])
	}
	/**
	 * Fetch all the available guild configurations.
	 * @returns {QueryResult}
	 */
	async getAllGuildsConfigurations() {
		return this._query(`
			SELECT * 
			FROM guild_configurations`, `all`)
	}
	/**
	 * Delete a user from user table entries.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	async deleteUser(userId = ``) {
		const fn = `[Database.deleteUser()]`
		if (!userId) throw new TypeError(`${fn} parameter "userId" is not provided.`)
		return this._query(`
			DELETE FROM users
			WHERE user_id = ?`, `run`, [userId], `Deleting USER_ID ${userId} from database`)
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
	 * [INTERNAL] End 
	 */
	/**
	 * [CONTROLLER] start
	 */
	/**
	 * Records command query/usage everytime user uses it.
	 * @param {CommandUsage} meta required parameters
	 * @returns {QueryResult}
	 */
	recordsCommandUsage({
		guild_id = ``,
		user_id = ``,
		command_alias = ``,
		resolved_in = `0ms`
	}) {
		return this._query(`
			INSERT INTO commands_log (
				registered_at, 
				user_id, 
				guild_id, 
				command_alias, 
				resolved_in
			)
			VALUES (datetime('now'), ?, ?, ?, ?)`, `run`, [user_id, guild_id, command_alias, resolved_in])
	}
	/**
	 * [CONTROLLER] End
	 */
	/**
	 * [LIBRARY] start
	 */
	/**
	 * Fetch registered user's reminders
	 * @param {string} userId
	 * @return {array}
	 */
	getUserReminders(userId = ``) {
		return this._query(`
			SELECT * 
			FROM user_reminders
			WHERE user_id = ?`, `all`, [userId])
	}
	/**
	 * Fetch all registered user's reminders
	 * @return {array}
	 */
	getAllReminders() {
		return this._query(`
			SELECT * 
			FROM user_reminders`, `all`)
	}
	/**
	 * Registering a new reminder
	 * @param {object}
	 * @return {QueryResult}
	 */
	registerUserReminder(context = {}) {
		return this._query(`
			INSERT INTO user_reminders(
				registered_at,
				reminder_id,
				user_id,
				message,
				remind_at
			)
			VALUES(?, ?, ?, ?, ?)`, `run`, [
			context.registeredAt.toString(),
			context.id,
			context.userId,
			context.message,
			JSON.stringify(context.remindAt)
		])
	}
	/**
	 * Deleting reminder from database
	 * @return {QueryResult}
	 */
	deleteUserReminder(reminderId = ``) {
		return this._query(`
			DELETE FROM user_reminders
			WHERE reminder_id = ?`, `run`, [reminderId])
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
				AND guild_id = ?`, `all`, [userId, guildId])
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
	 * Pull user's reputations metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserReputation(userId = ``, guildId = ``) {
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_reputations
            WHERE user_id = ?
            AND guild_id = ?`, `get`, [userId, guildId])
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
            AND guild_id =?`, `get`, [userId, guildId])
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
	 * Pull user's experience points metadata.
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild.
	 * @returns {QueryResult}
	 */
	async getUserExp(userId = ``, guildId = ``) {
		const key = `EXP_${userId}@${guildId}`
		//  Retrieve from cache if available
		const cache = await this.redis.get(key)
		if (cache) return JSON.parse(cache)
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_exp
            WHERE user_id = ?
            AND guild_id = ?`, `get`, [userId, guildId])
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
	 * Pull user's main metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUser(userId = ``) {
		return this._query(`
			SELECT *
			FROM users
			WHERE user_id = ?`, `get`, [userId])
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
			WHERE user_inventories.user_id = ? AND user_inventories.guild_id = ?`, `all`, [userId, guildId])
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
            WHERE item_id = ?`, `all`, [itemId])
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
			ORDER BY user_relationships.registered_at DESC`, `all`, [userId])
	}
	/**
	 * Deleting specific user's durational buff.
	 * @param {number} buffId
	 * @return {void}
	 */
	removeUserDurationalBuff(buffId) {
		this._query(`
            DELETE FROM user_durational_buffs
            WHERE buff_id = ?`, `run`, [buffId])
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
                AND guild_id =?`, `get`, [buffType, name, multiplier, userId, guildId])
		return res.buff_id || null
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
                AND multiplier = ?`, `get`, [buffType, name, multiplier]).then(res => {
			//  Update duration
			if (res.instance > 0) return this._query(`
                UPDATE user_durational_buffs
                SET registered_at = datetime('now')
                WHERE
                    type = ?
                    AND name = ?
                    AND multiplier = ?`, `run`, [buffType, name, multiplier])
			this._query(`
                INSERT INTO user_durational_buffs(
                    type,
                    name,
                    multiplier,
                    duration,
                    user_id,
                    guild_id
                )
                VALUES(?, ?, ?, ?, ?, ?)`, `run`, [buffType, name, multiplier, duration, userId, guildId])
		})
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
            WHERE user_id = ?`, `all`, [userId])
		return this._query(`
            SELECT *
            FROM user_durational_buffs`, `all`)
	}
	/**
	 * [LIBRARY] end
	 */
	/**
	 * [UTILS] functions -- START
	 */
	/**
	 * return an object containing all owned cards
	 * @param {string} userId 
	 * @returns {Object}
	 */
	async totalCollectedCards(userId = this.id) {
		let data = await this._query(`SELECT * FROM item_inventory WHERE user_id = ?`, `get`, [userId])
		for (let key in data) {
			if (!data[key]) delete data[key]
		}
		/**
		 * 	Filtering card from user inventory. Fyi, this doesn't have any to do with external db calling.
		 * 	@param {Object} data user metadata.
		 * 	@getCardFromInventory
		 */
		function filterCardFromInventory(data) {
			return Object.keys(data)
				.filter(key => key.endsWith(`_card`))
				.reduce((obj, key) => {
					obj[key] = data[key]
					return obj
				}, {})
		}
		data = filterCardFromInventory(data)
		return Object.keys(data).length
	}
	/**
	 * [UTILS] functions -- END
	 */
	/**
	 * [MULTIUSE] functions -- START
	 */
	/**
	 * Standardized method for making changes to the user_inventories
	 * @param {itemsMetadata} meta item's metadata
	 * @returns {boolean}
	 */
	async updateInventory({
		itemId,
		value = 0,
		operation = `+`,
		distributeMultiAccounts = false,
		userId,
		guildId
	}) {
		const fn = `[DB@UPDATE_INVENTORY]`
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!guildId && !distributeMultiAccounts) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)
		let res
		if (distributeMultiAccounts) {
			res = {
				//	Insert if no data entry exists.
				insert: await this._query(`
					INSERT INTO user_inventories (item_id, user_id)
					SELECT $itemId, $userId
					WHERE NOT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = $itemId AND user_id = $userId)
                    AND EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`, `run`, {
					itemId: itemId,
					userId: userId
				}),
				//	Try to update available row. It won't crash if no row is found.
				update: await this._query(`
					UPDATE user_inventories
					SET 
						quantity = quantity ${operation} ?,
						updated_at = datetime('now')
					WHERE item_id = ? AND user_id = ?`, `run`, [value, itemId, userId])
			}
		} else {
			res = {
				//	Insert if no data entry exists.
				insert: await this._query(`
					INSERT INTO user_inventories (item_id, user_id, guild_id)
					SELECT $itemId, $userId, $guildId
					WHERE NOT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = $itemId AND user_id = $userId AND guild_id = $guildId)
                    AND EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`, `run`, {
					itemId: itemId,
					userId: userId,
					guildId: guildId
				}),
				//	Try to update available row. It won't crash if no row is found.
				update: await this._query(`
					UPDATE user_inventories
					SET 
						quantity = quantity ${operation} ?,
						updated_at = datetime('now')
					WHERE item_id = ? AND user_id = ? AND guild_id = ?`, `run`, [value, itemId, userId, guildId])
			}
		}

		const type = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${type}(${distributeMultiAccounts ? `distributeMultiAccounts` : ``})(${operation}) (ITEM_ID:${itemId})(QTY:${value}) | USER_ID ${userId}`)
		return true
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
			WHERE guild_id = ?`, `all`, [guildId])
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
			WHERE NOT EXISTS (SELECT 1 FROM guilds WHERE guild_id = $guildId)`, `run`, {
			guildId: guild.id,
			guildName: guild.name
		})
	}
	/**
	 * Insert or update an existing guild config values
	 * @param {guildConfigurations} obj
	 * Options to be supplied to `this.updateGuildConfiguration()` parameters
	 * @typedef {object} guildConfigurations
	 * @property {string} [configCode=null] type of the configuration to be stored. Must be uppercased.
	 * @property {object} [guild+=null] Target guild_id to be stored.
	 * @property {string} [setByUserId=null] Identifier for the registrar.
	 * @property {map} [cacheTo=null] Target cache object to be stored into. If value is not provided, then result won't be cached.
	 *
	 * @returns {QueryResult}
	 */
	async updateGuildConfiguration({
		configCode = null,
		guild = null,
		customizedParameter = null,
		setByUserId = null,
		cacheTo = {}
	}) {
		const fn = `[Database.updateGuildConfiguration()]`
		if (!configCode || typeof configCode !== `string`) throw new TypeError(`${fn} property "configCode" must be string and non-faulty value.`)
		if (!guild || typeof guild !== `object`) throw new TypeError(`${fn} property "guild" must be a guild object and non-faulty value.`)
		if (!setByUserId || typeof setByUserId !== `string`) throw new TypeError(`${fn} property "setByUserId" must be string and cannot be anonymous.`)
		//  Register guild incase they aren't registered yet
		this.registerGuild(guild)
		//  Parsing data type of customizedParameter so it can be stored in the database.
		//  The original type of customizedParameter remains unaffected.
		const parsedValueParameter = typeof customizedParameter === `object` ?
			JSON.stringify(customizedParameter) :
			typeof customizedParameter === `number` ?
			parseInt(customizedParameter) :
			customizedParameter
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
				)`, `run`, {
				configCode: configCode,
				customizedParameter: parsedValueParameter,
				guildId: guild.id,
				setByUserId: setByUserId
			}),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE guild_configurations
				SET 
					customized_parameter = ?,
					set_by_user_id = ?,
					updated_at = datetime('now')
				WHERE 
					config_code = ?
					AND guild_id = ?`, `run`, [parsedValueParameter, setByUserId, configCode, guild.id])
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
				AND guild_id = ?`, `run`, [configCode, guildId], `Performing config(${configCode}) deletion for GUILD_ID:${guildId}`)
		const type = res.changes ? `DELETED` : `NO_CHANGES`
		logger.info(`${fn} ${type} (CONFIG_CODE:${configCode})(GUILD_ID:${guildId})`)
		return true
	}
	/**
	 * Register a user into user-tree tables if doesn't exist.
	 * @param {string} [userId=``] User's discord id.
	 * @param {string} [userName=``] User's username. Purposely used when fail to fetch user by id.
	 * @returns {void}
	 */
	async validateUserEntry(userId = ``, userName = ``) {
		//  Check on cache
		const key = `VALIDATED_USERID`
		const onCache = await this.redis.sismember(key, userId)
		//  if true/registered, skip database hit.
		if (onCache) return
		const res = await this._query(`
            INSERT INTO users(user_id, name)
            SELECT $userId, $userName
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`, `run`, {
			userId: userId,
			userName: userName
		})
		if (res.changes) logger.info(`USER_ID:${userId} registered`)
		this.redis.sadd(key, userId)
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
		const res = {
			update: await this._query(`
                UPDATE user_reputations 
                SET 
                    total_reps = total_reps + ?,
                    last_received_at = datetime('now'),
                    recently_received_by = ?
                WHERE user_id = ? AND guild_id = ?`, `run`, [amount, givenBy, userId, guildId]),
			insert: await this._query(`
                INSERT INTO user_reputations(last_giving_at, user_id, guild_id, total_reps)
                SELECT datetime('now','-1 day'), $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_reputations WHERE user_id = $userId AND guild_id = $guildId)`, `run`, {
				userId: userId,
				guildId: guildId,
				amount: amount
			})
		}
		//  Refresh cache 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_REPS][${type}](${operation}) (REPS:${amount} | EXP_ID:${userId}@${guildId}`)
	}
	/**
	 * Converts db's timestamp to local/current machine date.
	 * @param {string} [timestamp=`now`] datetime from sql to be parsed from.
	 * @returns {string}
	 */
	async toLocaltime(timestamp = `now`) {
		const res = await this._query(`
			SELECT datetime(?, 'localtime') AS timestamp`, `get`, [timestamp])
		return res.timestamp
	}
	/**
	 * Updating user's experience points.
	 * @param {number} [amount=0] Amount to be added.
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild id.
	 * @param {string} [operation=`+`] Set as `-` to do exp substraction.
	 * @returns {QueryResult}
	 */
	async updateUserExp(amount = 0, userId = ``, guildId = ``, operation = `+`) {
		const res = {
			update: await this._query(`
                UPDATE user_exp 
                SET current_exp = current_exp ${operation} ?
                WHERE 
                    user_id = ?
                    AND guild_id = ?`, `run`, [amount, userId, guildId]),
			insert: await this._query(`
                INSERT INTO user_exp(user_id, guild_id, current_exp)
                SELECT $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_exp WHERE user_id = $userId AND guild_id = $guildId)`, `run`, {
				userId: userId,
				guildId: guildId,
				amount: amount
			})
		}
		//  Refresh cache 
		this.redis.del(`EXP_${userId}@${guildId}`)
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_EXP][${type}](${operation}) (EXP:${amount} | EXP_ID:${userId}@${guildId}`)
	}
	/**
	 * Fetch user's current artcoins/balance.
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {number}
	 */
	async getUserBalance(userId, guildId) {
		const res = await this._query(`
            SELECT * 
            FROM user_inventories 
            WHERE
                user_id = ?
                AND guild_id = ?
                AND item_id = 52`, `get`, [userId, guildId])
		//  Fallback to zero if entry not exists.
		return res ? res.quantity : 0
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
		if (keyword === null && typeof guildId === `string`) return this._query(str + ` WHERE owned_by_guild_id = ?`, `all`, [guildId])
		//  Do single fetch on specific guild
		if (keyword && typeof guildId === `string`) return this._query(str + `
            WHERE 
                owned_by_guild_id = $guildId
                AND lower(items.name) = lower($keyword)`, `get`, {
			keyword: keyword,
			guildId: guildId
		})
		return this._query(str + ` 
			WHERE 
				items.item_id = $keyword
				OR lower(items.name) = lower($keyword)
				OR lower(items.alias) = lower($keyword)
			LIMIT 1`, `get`, {
			keyword: keyword
		})
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
            WHERE guild_id = ?`, `all`, [guildId])
	}
	/**
	 * Pull ID ranking based on given descendant column order.
	 * @param {string} [group=``] of target category
	 * @returns {QueryResult}
	 */
	async indexRanking(group = ``, guildId = ``) {
		if (group === `exp`) return this._query(`
			SELECT 
				user_id AS id, 
				current_exp AS points 
			FROM user_exp 
			WHERE guild_id = ?
			ORDER BY current_exp DESC`, `all`, [guildId], `Fetching exp leaderboard`, true)

		if (group === `artcoins`) return this._query(`
			SELECT 
				user_id AS id, 
				quantity AS points 
			FROM user_inventories 
			WHERE item_id = 52 
				AND guild_id = ?
			ORDER BY quantity DESC`, `all`, [guildId], `Fetching artcoins leaderboard`, true)

		if (group === `fame`) return this._query(`
			SELECT 
				user_id AS id, 
				total_reps AS points 
			FROM user_reputations 
			WHERE guild_id = ?
			ORDER BY total_reps DESC`, `all`, [guildId], `Fetching fame leaderboard`, true)

		if (group === `artists`) return this._query(`
			SELECT 
				user_id AS id, 
				SUM(total_likes) AS points 
			FROM user_posts
			GROUP BY user_id
			ORDER BY points DESC`, `all`, [], `Fetching artists leaderboard`, true)
	}
	/**
	 * [MULTIUSE] functions -- END
	 */
	/**
	 * [COMMAND] Start of gacha
	 */
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
            WHERE owned_by_guild_id IS NULL`, `all`)
		//  Cache rewards pool for 1 hour
		this.redis.set(cacheId, JSON.stringify(res), `EX`, 60 * 60)
		return res
	}
	/**
	 * [COMMAND] End of gacha
	 */
	/**
	 * [COMMAND] Start of setRelationship
	 */
	/**
	 * Fetch metadata of a relationship type.
	 * @param {string} name Target relationship name
	 * @return {object|null}
	 */
	getRelationship(name) {
		return this._query(`
		SELECT *
		FROM relationships
		WHERE name = ?`, `get`, [name])
	}
	/**
	 * Pull available relationship types
	 * @returns {QueryResult}
	 */
	getAvailableRelationships() {
		return this._query(`
			SELECT * FROM relationships
			WHERE name IN ('parent', 'kid', 'old sibling', 'young sibling', 'couple', 'bestfriend') ORDER BY relationship_id ASC`, `all`)
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
				WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id_A = $userA AND user_id_B = $userB)`, `run`, {
				userA: userA,
				userB: userB,
				relationshipId: relationshipId,
				guildId: guildId
			}, `Registering new relationship for ${userA} and ${userB} in GUILD_ID ${guildId}`),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_relationships
				SET relationship_id = ?
				WHERE 
					user_id_A = ?
					AND user_id_B = ?`, `run`, [relationshipId, userA, userB])
		}

		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${stmtType} (REL_ID:${relationshipId})(USER_A:${userA} WITH USER_B:${userB})`)
		return true
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
				AND user_id_B = ?`, `run`, [userA, userB], `Removing ${userA} and ${userB} relationship.`)
	}
	/**
	 * [COMMAND] End of setRelationship
	 */
	/**
	 * [COMMAND] Start of setGender
	 */
	/**
	 * Pull user's gender data
	 * @param {string} [userId=``] Target user id
	 * @return {object|null}
	 */
	getUserGender(userId = ``) {
		return this._query(`SELECT * FROM user_gender WHERE user_id = ?`, `get`, [userId])
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
				WHERE NOT EXISTS (SELECT 1 FROM user_gender WHERE user_id = $userId)`, `run`, {
				userId: userId,
				gender: gender
			}),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_gender
				SET gender = ?
				WHERE 
					user_id = ?`, `run`, [gender, userId])
		}
		const stmtType = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`[DB@UPDATE_USER_GENDER] ${stmtType} (GENDER:${gender})(USER_ID:${userId}`)
	}
	/**
	 * [COMMAND] End of setGender
	 */
	/**
	 * [COMMAND] Start of setTheme
	 */
	/**
	 * Return what theme the user has selected in that guild
	 * @param {string} userId the user's specific id
	 * @param {string} guildId the current guild id the user is in
	 * @returns 
	 */
	async findCurrentTheme(userId, guildId) {
		// first see if light theme is equiped
		let res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`, `get`, {
			theme: `4`,
			userId: userId,
			guildId: guildId
		})
		if (Object.values(res)[0] == 1) return `light`
		// second see if dark theme is equiped
		res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`, `get`, {
			theme: `3`,
			userId: userId,
			guildId: guildId
		})
		if (Object.values(res)[0] == 1) return `dark`
		return `none`
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
		return this.updateInventory({
			itemId: theme,
			value: 1,
			operation: `+`,
			userId: userId,
			guildId: guildId
		})
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
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme)`, `get`, {
			theme: theme,
			userId: userId,
			guildId: guildId
		})
	}
	/**
	 * Set the theme to use for the specified user
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns 
	 */
	setTheme(theme, userId, guildId) {
		let themeToSet, themeToUnset
		if (theme == `dark`) {
			themeToSet = `3`
			themeToUnset = `4`
		} else if (theme == `light`) {
			themeToSet = `4`
			themeToUnset = `3`
		}
		this._query(`UPDATE user_inventories SET in_use = 1 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`, `run`, {
			theme: themeToSet,
			userId: userId,
			guildId: guildId
		})
		this._query(`UPDATE user_inventories SET in_use = 0 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`, `run`, {
			theme: themeToUnset,
			userId: userId,
			guildId: guildId
		})
		return
	}
	/**
	 * [COMMAND] End of setTheme
	 */
	/**
	 * [COMMAND] Start of buy
	 */
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
            WHERE item_id = ?`, `run`, [amount, itemId])
	}
	/**
	 * [COMMAND] End of buy
	 */
	/**
	 * [COMMAND] Start of setExp
	 */
	/**
	 * Reset user's exp to zero. 
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild id.
	 * @return {void}
	 */
	resetUserExp(userId = ``, guildId = ``) {
		const fn = `[Database.resetUserExp]`
		const key = `EXP_${userId}@${guildId}`
		//  Update on database.
		const dbTime = process.hrtime()
		this._query(`
			UPDATE user_exp 
			SET current_exp = 0 
			WHERE 
				user_id = ?
				AND guild_id = ?`, `run`, [userId, guildId]).then(() => logger.debug(`${fn} updated ${key} on database. (${getBenchmark(dbTime)})`))
		//  Refresh cache by deleting it
		this.redis.del(key)
	}
	/**
	 * [COMMAND] End of setExp
	 */
	/**
	 * [COMMAND] Start of daily
	 */
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
                WHERE user_id = ? AND guild_id = ?`, `run`, [streak, userId, guildId]),
			insert: await this._query(`
                INSERT INTO user_dailies(updated_at, total_streak, user_id, guild_id)
                SELECT datetime('now','-1 day'), -1, $userId, $guildId
                WHERE NOT EXISTS (SELECT 1 FROM user_dailies WHERE user_id = $userId AND guild_id = $guildId)`, `run`, {
				userId: userId,
				guildId: guildId
			})
		}
		//  Refresh cache
		this.redis.del(`DAILIES_${userId}@${guildId}`)
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_DAILIES][${type}] (STREAK:${streak} | DAILIES_ID:${userId}@${guildId}`)
	}
	/**
	 * [COMMAND] End of daily
	 */

	/**
	 * [COMMAND] Start of rep
	 */
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
            AND guild_id = ?`, `run`, [userId, guildId])
	}
	/**
	 * [COMMAND] End of rep
	 */

	/**
	 * [COMMAND] Start of setBio
	 */
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
			WHERE user_id = ?`, `run`, [bio, userId], `Updating bio for USER_ID:${userId}`)
	}
	/**
	 * [COMMAND] End of setBio
	 */

	/**
	 * [COMMAND] Start of stats
	 */
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
			FROM commands_log`)
		//  Store for 12 hours expire
		this.redis.set(key, JSON.stringify(res), `EX`, (60 * 60) * 12)
		return res
	}
	/**
	 * [COMMAND] End of stats
	 */

	/**
	 * [COMMAND] Start of setCover
	 */
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
				AND guild_id = ?`, `run`, [userId, guildId], `Performing self-upload cover deletion on USER_ID:${userId} on GUILD_ID:${guildId}`)
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
				WHERE NOT EXISTS (SELECT 1 FROM user_self_covers WHERE user_id = $userId AND guild_id = $guildId)`, `run`, {
				coverId: coverId,
				userId: userId,
				guildId: guildId
			}),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_self_covers
				SET 
					cover_id = ?,
					registered_at = datetime('now')
				WHERE 
					user_id = ? 
					AND guild_id = ?`, `run`, [coverId, userId, guildId])
		}
		return res
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
    			AND guild_id = ?`, `run`, [coverId, userId, guildId], `${fn} Applying cover[${coverId}] for USER_ID${userId} in GUILD_ID:${guildId}`)
		return res
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
    			)`, `run`, [userId, guildId], `${fn} Detaching covers from USER_ID:${userId} in GUILD_ID:${guildId}`)
		return res
	}
	/**
	 * [COMMAND] End of setCover
	 */

	/**
	 * [COMMAND] Start of autoRespond
	 */
	/**
	 * Registering new autoresponder to specific guild.
	 * @param {AutoresponderMetadata} [meta={}] The AR metadata to be registered.
	 * @typedef {object} AutoresponderMetadata
	 * @property {string} [guildId=``] Target guild.
	 * @property {string} [userId=``] Set by user.
	 * @property {string} [trigger=``] Trigger to specific message.
	 * @property {string} [response=``] The response from trigger.
	 * @return {QueryResult}
	 */
	async registerAutoResponder({
		guildId = ``,
		userId = ``,
		trigger = ``,
		response = ``
	}) {
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
			VALUES(?, ?, ?, ?)`, `run`, [guildId, userId, trigger, response], `Inserting new AR for GUILD_ID:${guildId}`)
		const ARmeta = (await this._query(`
			SELECT *
			FROM autoresponders
			WHERE guild_id = ?
			ORDER BY ar_id DESC`, `all`, [guildId]))[0]
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
				AND guild_id = ?`, `run`, [id, guildId], `Deleting AR with ID:${id} from GUILD_ID:${guildId}`)
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
			WHERE guild_id = ?`, `run`, [guildId], `Deleting all ARs from GUILD_ID:${guildId}`)
	}
	/**
	 * [COMMAND] End of autoRespond
	 */

	/**
	 * [COMMAND] Start of affiliates
	 */
	/**
	 * Fetch all the registered servers in affiliate table
	 * @return {QueryResult} 
	 */
	async getAffiliates() {
		return this._query(`SELECT * FROM affiliates`, `all`, [], `Fetching affiliates list`)
	}

	/**
	 * [COMMAND] End of affiliates
	 */
	/**
	 * [COMMAND] Start of setShop
	 */
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
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, `run`, [
			item.name,
			item.description,
			item.alias,
			item.typeId,
			item.rarityId,
			item.bind,
			item.ownedByGuildId,
			item.responseOnUse,
			item.usable
		])
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
            VALUES(?, ?, ?, ?)`, `run`, [itemId, guildId, quantity, price])
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
            WHERE item_id = ?`, `run`, [param, itemId])
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
            WHERE item_id = ?`, `run`, [param, itemId])
	}
	/**
	 * Remove an item from the shops table
	 * @param {number} [itemId] target item to search.
	 * @returns {QueryResult}
	 */
	removeGuildShopItem(itemId) {
		return this._query(`
			DELETE FROM shop
			WHERE item_id = $itemId`, `run`, {
			itemId: itemId
		})
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
            VALUES(?, ?, ?, ?)`, `run`, [itemId, guildId, effectRefId, JSON.stringify(parameters)])
	}
	/**
	 * [COMMAND] End of setShop
	 */
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
		FROM quests`, `all`, [], `Fetching all the available quests in master quests table`)
		//  Store quest pool cache for 3 hours.
		this.redis.set(cacheId, JSON.stringify(res), `EX`, (60 * 60) * 3)
		return res
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
			WHERE NOT EXISTS (SELECT 1 FROM user_quests WHERE user_id = $userId AND guild_id = $guildId)`, `run`, {
			userId: userId,
			guildId: guildId
		})
		return this._query(`
			SELECT *
			FROM user_quests
			WHERE 
				user_id = ?
				AND guild_id = ?`, `get`, [userId, guildId])
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
				AND guild_id = ?`, `run`, [nextQuestId, userId, guildId], `Updating next active quest ID for ${userId}@${guildId}`)
	}
	/**
	 * Log user's quest activity after completing a quest
	 * @param {string} [userId=``] user that completes the quest
	 * @param {string} [guildId=``] target guild where quest get completed
	 * @param {string} [questId=``] the quest user just took
	 * @param {string} [answer=``] the answer used to clear the quest
	 * @return {QueryResult}
	 */
	recordQuestActivity(userId = ``, guildId = ``, questId = ``, answer = ``) {
		return this._query(`
			INSERT INTO quest_log(
				quest_id,
				user_id,
				guild_id,
				answer
			)
			VALUES(?, ?, ?, ?)`, `run`, [questId, userId, guildId, answer], `Storing ${userId}@${guildId} quest's activity to quest_log table`)
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
				AND guild_id = ?`, `run`, [nextQuestId, userId, guildId], `Updating ${userId}@${guildId} quest data`)
	}
	/**
	 * End of Quest related Functions
	 */
	/**
	 * Verify each table exists and if it doesn't create the table
	 */
	async verifyTables() {
		const TABLES = [{
				stmt: `CREATE TABLE 'users'( 
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						'last_login_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						'user_id'	TEXT,
						'name'	REAL,
						'bio'	TEXT DEFAULT 'Hi! I''m a new user!',
						'verified'	INTEGER DEFAULT 0,
						'lang'	TEXT DEFAULT 'en',
						'receive_notification'	INTEGER DEFAULT -1,
						PRIMARY KEY('user_id')
						)`,
				tablename: `users`
			},
			{
				stmt: `CREATE TABLE item_rarities (

					'rarity_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'name' TEXT,
					'level' INTEGER UNIQUE,
					'color' TEXT DEFAULT '#000000'
		 
					)`,
				tablename: `item_rarities`
			},
			{
				stmt: `CREATE TABLE item_types (

					'type_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'name' TEXT,
					'alias' TEXT,
					'max_stacks' INTEGER DEFAULT 9999,
					'max_use' INTEGER DEFAULT 9999
		 
					)`,
				tablename: `item_types`
			},
			{
				stmt: `CREATE TABLE quests (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'quest_id'	INTEGER PRIMARY KEY AUTOINCREMENT,
					'reward_amount'	INTEGER,
					'name'	TEXT,
					'description'	TEXT,
					'correct_answer'	TEXT
				)`,
				tablename: `quests`
			},
			{
				stmt: `CREATE TABLE relationships (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'relationship_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'name' TEXT
		 
					)`,
				tablename: `relationships`
			},
			{
				stmt: `CREATE TABLE items (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'item_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'name' TEXT,
					'description' TEXT,
					'alias' TEXT,
					'type_id' INTEGER,
					'rarity_id' INTEGER,
					'bind' TEXT DEFAULT 0,
		 
					FOREIGN KEY (rarity_id) 
					REFERENCES item_rarities(rarity_id)
							ON UPDATE CASCADE
							ON DELETE SET NULL,
		 
					FOREIGN KEY (type_id) 
					REFERENCES item_types(type_id)
							ON UPDATE CASCADE
							ON DELETE SET NULL
		 
					)`,
				tablename: `items`
			},
			{
				stmt: `CREATE TABLE guilds (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'guild_id' TEXT PRIMARY KEY,
					'name' TEXT,
					'bio' TEXT
		 
					)`,
				tablename: `guilds`
			},
			{
				stmt: `CREATE TABLE autoresponders (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'ar_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'guild_id' TEXT,
					'user_id' TEXT,
					'trigger' TEXT,
					'response' TEXT
		 
					)`,
				tablename: `autoresponders`
			},
			{
				stmt: `CREATE TABLE item_effects(
					effect_id INTEGER PRIMARY KEY AUTOINCREMENT,
					registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					item_id INTEGER,
					guild_id TEXT,
					effect_ref_id INTEGER,
					parameter TEXT,
	
					FOREIGN KEY(item_id)
					REFERENCES items(item_id)
						ON UPDATE CASCADE
						ON DELETE CASCADE,
					FOREIGN KEY(guild_id)
					REFERENCES guilds(guild_id)
						ON UPDATE CASCADE
						ON DELETE CASCADE)`,
				tablename: `item_effects`
			},
			{
				stmt: `CREATE TABLE user_durational_buffs(
					buff_id INTEGER PRIMARY KEY AUTOINCREMENT,
					registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					name TEXT,
					type TEXT,
					multiplier INTEGER,
					duration INTEGER,
					user_id TEXT,
					guild_id TEXT,
	
					FOREIGN KEY(user_id)
					REFERENCES users(user_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE)`,
				tablename: `user_durational_buffs`
			},
			{
				stmt: `CREATE TABLE user_gender(
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id' TEXT,
					'gender' TEXT,
					PRIMARY KEY(user_id),
					FOREIGN KEY(user_id)
					REFERENCES users(user_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE)`,
				tablename: `user_gender`
			},
			{
				stmt: `CREATE TABLE affiliates (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'guild_id' TEXT NOT NULL,
					'description' TEXT DEFAULT 'Another awesome guild!',
					'invite_link' TEXT,
					'notes' TEXT)`,
				tablename: `affiliates`
			},
			{
				stmt: `CREATE TABLE commands_log (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'user_id' TEXT,
					'channel_id' TEXT,
					'guild_id' TEXT,
					'command_alias' TEXT,
					'resolved_in' TEXT
		 
					)`,
				tablename: `commands_log`
			},
			{
				stmt: `CREATE TABLE guild_configurations (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'config_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'config_code' TEXT,
					'guild_id' TEXT,
					'customized_parameter' TEXT,
					'set_by_user_id' TEXT,
		
					FOREIGN KEY(guild_id)
					REFERENCES guilds(guild_id)
						ON DELETE CASCADE
						ON UPDATE CASCADE
		
					FOREIGN KEY(set_by_user_id)
					REFERENCES users(user_id)
						   ON UPDATE CASCADE
						ON DELETE SET NULL
		
					)`,
				tablename: `guild_configurations`
			},
			{
				stmt: `CREATE TABLE item_gacha (

					'gacha_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'item_id' INTEGER,
					'quantity' INTEGER DEFAULT 1,
					'weight' REAL,
		 
					 FOREIGN KEY(item_id)
					 REFERENCES items(item_id)
						 ON DELETE CASCADE
						 ON UPDATE CASCADE
		 
					)`,
				tablename: `item_gacha`
			},
			{
				stmt: `CREATE TABLE quest_log (
					registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					quest_id INTEGER,
					user_id TEXT,
					guild_id TEXT,
					answer TEXT)`,
				tablename: `quest_log`
			},
			{
				stmt: `CREATE TABLE resource_log (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'uptime' INTEGER,
					'ping' REAL,
					'cpu' REAL,
					'memory' REAL
		 
					)`,
				tablename: `resource_log`
			},
			{
				stmt: `CREATE TABLE shop (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'shop_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'item_id' INTEGER,
					'item_price_id' INTEGER,
					'price' INTEGER DEFAULT 100,
		 
					FOREIGN KEY (item_id) 
					REFERENCES items(item_id)
							ON UPDATE CASCADE
							ON DELETE CASCADE,
		 
					FOREIGN KEY (item_price_id) 
					REFERENCES items(item_id)
							ON UPDATE CASCADE
							ON DELETE CASCADE
		 
					)`,
				tablename: `shop`
			},
			{
				stmt: `CREATE TABLE user_dailies (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id'	TEXT,
					'total_streak'	INTEGER DEFAULT 0,
					'guild_id'	TEXT,
					FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
					PRIMARY KEY(user_id,guild_id)
				)`,
				tablename: `user_dailies`
			},
			{
				stmt: `CREATE TABLE user_exp (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id'	TEXT,
					'current_exp'	INTEGER DEFAULT 0,
					'booster_id'	INTEGER,
					'booster_activated_at'	TIMESTAMP,
					'guild_id'	TEXT,
					FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
					FOREIGN KEY(booster_id) REFERENCES items(item_id) ON DELETE CASCADE ON UPDATE CASCADE,
					PRIMARY KEY(user_id,guild_id)
				)`,
				tablename: `user_exp`
			},
			{
				stmt: `CREATE TABLE user_inventories (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id'	TEXT,
					'item_id'	INTEGER,
					'quantity'	INTEGER DEFAULT 0,
					'in_use'	INTEGER DEFAULT 0,
					'guild_id'	TEXT,
					FOREIGN KEY(item_id) REFERENCES items(item_id) ON DELETE CASCADE ON UPDATE CASCADE,
					FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
					PRIMARY KEY(user_id,item_id,guild_id)
				)`,
				tablename: `user_inventories`
			},
			{
				stmt: `CREATE TABLE user_quests (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id' TEXT,
					'guild_id' TEXT,
					'next_quest_id' INTEGER,
		
					PRIMARY KEY(user_id, guild_id)
		
					FOREIGN KEY(next_quest_id)
					REFERENCES quests(quest_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE
		
					FOREIGN KEY(user_id)
					REFERENCES users(user_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE
		
					FOREIGN KEY(guild_id)
					REFERENCES guilds(guild_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE)`,
				tablename: `user_quests`
			},
			{
				stmt: `CREATE TABLE user_relationships (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id_A'	TEXT,
					'user_id_B'	TEXT,
					'relationship_id'	TEXT,
					'guild_id'	TEXT,
					FOREIGN KEY(user_id_A) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
					FOREIGN KEY(user_id_B) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
					FOREIGN KEY(relationship_id) REFERENCES relationships(relationship_id) ON DELETE CASCADE ON UPDATE CASCADE,
					PRIMARY KEY(user_id_A,user_id_B,guild_id)
				)`,
				tablename: `user_relationships`
			},
			{
				stmt: `CREATE TABLE user_reminders (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'reminder_id' TEXT PRIMARY KEY,
					'user_id' TEXT,
					'message' TEXT,
					'remind_at' TEXT,
		 
					FOREIGN KEY(user_id)
					REFERENCES users(user_id) 
						ON DELETE CASCADE
						ON UPDATE CASCADE
		 
					)`,
				tablename: `user_reminders`
			},
			{
				stmt: `CREATE TABLE user_reputations (
					'registered_at'	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'last_giving_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'last_received_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id'	TEXT,
					'total_reps' INTEGER DEFAULT 0,
					'recently_received_by' TEXT,
					'guild_id' TEXT,
					PRIMARY KEY(user_id, guild_id),
					FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
				)`,
				tablename: `user_reputations`
			},
			{
				stmt: `CREATE TABLE user_self_covers (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'cover_id' TEXT,
					'user_id' TEXT,
					'guild_id' TEXT,
					PRIMARY KEY(user_id, guild_id),
					FOREIGN KEY(user_id)
					REFERENCES users(user_id) 
					   ON DELETE CASCADE
					   ON UPDATE CASCADE)`,
				tablename: `user_self_covers`
			},
			{
				stmt: `CREATE TABLE user_socialmedias (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'socialmedia_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'user_id' TEXT,
					'url' TEXT,
					'account_type' TEXT,
		 
					FOREIGN KEY(user_id)
					REFERENCES users(user_id)
							ON DELETE CASCADE
							ON UPDATE CASCADE
		 
					)`,
				tablename: `user_socialmedias`
			},
			{
				stmt: `CREATE TABLE trading_trades (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_id' TEXT NOT NULL,
					'guild_id' TEXT NOT NULL,
					'trade_id' REAL UNIQUE NOT NULL,
					'status' TEXT NOT NULL,
					'channel' TEXT NOT NULL UNIQUE DEFAULT 0)`,
				tablename: `trading_trades`
			},
			{
				stmt: `CREATE TABLE trading_transaction (
					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'user_one_id' TEXT NOT NULL,
					'user_two_id' TEXT NOT NULL,
					'guild_id' TEXT NOT NULL,
					'trade_id' TEXT NOT NULL,
					'user_one_item' TEXT NOT NULL,
					'user_two_item' TEXT NOT NULL)`,
				tablename: `trading_transaction`
			},
			{
				stmt: `CREATE TABLE IF NOT EXISTS trading_blocked_users (
						'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
						'user_id' TEXT NOT NULL UNIQUE,
						'blocked' INTEGER DEFAULT 0,
						'reason' TEXT DEFAULT 'The Moderator didnt supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.')`,
				tablename: `trading_blocked_users`
			},
			{
				stmt: `CREATE TABLE user_posts (

					'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					'post_id' INTEGER PRIMARY KEY AUTOINCREMENT,
					'user_id' TEXT,
					'channel_id' TEXT,
					'guild_id' TEXT,
					'url' TEXT,
					'caption' TEXT,
					'total_likes' INTEGER DEFAULT 0,
					'recently_liked_by' TEXT,
		 
					FOREIGN KEY(user_id)
					REFERENCES users(user_id)
						 ON DELETE CASCADE
						 ON UPDATE CASCADE
		 
					)`,
				tablename: `user_posts`
			}
		]

		logger.info(`Verifing all tables that are requirred are present. This may take a while...`)
		//let TABLESTOARRAY = Object.keys(TABLES).map((key) => [Number(key), TABLES[key]])
		console.log(`starting loop`)
		TABLES.forEach(async (table) => await this._query(table.stmt, `run`, [], `Verifing ${table.tablename} table`)).then()
		logger.info(`All Table that are requirred have been verified`)
	}
}

module.exports = Database