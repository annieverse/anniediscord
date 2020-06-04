const SqliteClient = require(`better-sqlite3`)
const Redis = require(`async-redis`)
const logger = require(`./logger`)
const { accessSync, constants } = require(`fs`)
const { join } = require(`path`)

/**
 * Centralized Class for handling various database tasks 
 * for Annie.
 */
class Database {

	/**
	 * Options to be supplied to `this.updateInventory()` parameters
	 * @typedef {Object} itemsMetadata
	 * @property {number} [itemId] The item's id. Refer to `items` table
	 * @property {number} [value=0] Amount to be stored.
	 * @property {string} [operation=`+`] `+, -, *, /` is the available operation.
	 * @property {string} [userId] target user's discord id
	 */

	/**
	 * Options to be supplied to `this.updateProfileDecoration()` parameters
	 * @typedef {Object} ProfileDecoration
	 * @property {number} decorId the decor id. used to refer to `items` table when looking for its metadata.
	 * @property {string} [decorType=``] decor name. must be uppercased.
	 * @property {string} [userId=``] target user's discord id
	 * @property {string} [inUse=0] set `1` to enable the decoration and `0` to disable the decoration.
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
	 * Required metadata to register new entry for `strike_records` table
	 * @typedef {object} StrikeEntry
	 * @property {string} [user_id=``] target user id to be reported
	 * @property {string} [reason=`not_provided`] providing the reason why user is striked is helpful sometimes. :)
	 * @property {string} [reported_by=``] reporter's user id
	 * @property {string} [guild_id=``] the server where user get reported
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
	 * Required metadata to register new entry for `user_posts` table
	 * @typedef {object} UserPost
	 * @property {string} [userId=``] post's author
	 * @property {string} [url=``] the post' url
	 * @property {string} [caption=``] post's caption. Can be blank
	 * @property {string} [channelId=``] the channel id where the post is submitted
	 * @property {string} [guildId=``] the guild id where the post is submitted
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
	 * @param {object} client sql instance that is going to be used
	 */
	constructor(client={}) {
		this.client = client
	}

	/**
	 * Opening database connection
	 * @param {string} [path=`.data/database.sqlite`]
	 * @param {string} [fsPath=`../../.data/database.sqlite`]
	 * @returns {this}
	 */
	connect(path=`.data/database.sqlite`, fsPath=`../../.data/database.sqlite`) {
		/**
		 * This will check if the db file exists or not.
		 * If file is not found, throw an error.
		 */
		accessSync(join(__dirname, fsPath), constants.F_OK)
		this.client = new SqliteClient(path)
		const redisClient = Redis.createClient()
		redisClient.on(`error`, err => new Error(`Failed to connect redis > ${err}`))
		this.redis = redisClient
		return this
	}

	/**
	 * 	Standardized method for executing sql query
	 * 	@param {string} [stmt=``] sql statement
	 * 	@param {string} [type=`get`] `get` for single result, `all` for multiple result
	 * 	and `run` to execute statement such as UPDATE/INSERT/CREATE.
	 * 	@param {array} [supplies=[]] parameters to be supplied into sql statement.
	 *  @param {string} [label=``] description for the query. Optional
	 *  @param {boolean} [rowsOnly=false] set this to `true` to remove stmt property from returned result. Optional for debugging purposes.
	 *  @param {boolean} [ignoreError=false] set this to `true` to keep the method running even when the error occurs. Optional
	 *  @private
	 *  @returns {QueryResult}
	 */
	async _query(stmt=``, type=`get`, supplies=[], label=``, rowsOnly=true, ignoreError=false) {
		const fn = `[Database._query()]`
		//	Return if no statement has found
		if (!stmt) return null
		try {
			let result = await this.client.prepare(stmt)[type](supplies)
			if (label) logger.info(`${fn} ${label}`)
			if (!result) return null
			if (!rowsOnly) result.stmt = stmt
			return result
		}
		catch (e) {
			if (ignoreError) return
			logger.error(`${fn} has failed to run > ${e.stack}\n${stmt}`)
			throw e
		}
	}

	/**
	 * Standardized method for making changes to the user_inventories
	 * @param {itemsMetadata} meta item's metadata
	 * @returns {boolean}
	 */
	async updateInventory({itemId, value=0, operation=`+`, userId}) {
		const fn = `[Database.updateInventory()]`
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
				INSERT INTO user_inventories (item_id, user_id)
				SELECT $itemId, $userId
				WHERE NOT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = $itemId AND user_id = $userId)`
				, `run`
				, {itemId: itemId, userId: userId}
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_inventories
				SET 
					quantity = quantity ${operation} ?,
					updated_at = datetime('now')
				WHERE item_id = ? AND user_id = ?`
				, `run`
				, [value, itemId, userId]
			)
		}
		
		const type = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${type}(${operation}) (ITEM_ID:${itemId})(QTY:${value}) | USER_ID ${userId}`)
		return true
	}

	/**
	 * Set user item's `in_use`` value to `1`
	 * @param {number} [itemId] target item's id.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	useItem(itemId, userId=``) {
		const fn = `[Database.useItem()]`
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)		
		return this._query(`
			UPDATE user_inventories
			SET in_use = 1
			WHERE 
				user_id = ?
				AND item_id = ?`
			, `run`
			, [userId, itemId]
		)
	}

	/**
	 * Set user item's `in_use`` value to `0`
	 * @param {number} [itemId] target item's id.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	unuseItem(itemId, userId=``) {
		const fn = `[Database.useItem()]`
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)		
		return this._query(`
			UPDATE user_inventories
			SET in_use = 0
			WHERE 
				user_id = ?
				AND item_id = ?`
			, `run`
			, [userId, itemId]
		)
	}

	/**
	 * 	Standard low method for writing to limitedShopRoles
	 *  @deprecated
	 *  @param {Number|ID} itemId item id
	 *  @param {Number} value amount to be stored
	 *  @param {Symbol} operation `+` for (sum), `-` for subtract and so on.
	 *  @param {String|ID} userId user id
	 */
	async _limitedShopRoles({ roleId, value = 0, operation = `update`, userId = this.id }) {
		//	Return if roleId is not specified
		if (!roleId) return { stored: false }
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
				INSERT INTO limitedShopRoles (user_id, role_id)
				SELECT $userId, $roleId
				WHERE NOT EXISTS (SELECT 1 FROM limitedShopRoles WHERE role_id = $roleId AND user_id = $userId)`
				, `run`
				, { $roleId: roleId, $userId: userId}
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE limitedShopRoles
				SET remove_by = ?
				WHERE role_id = ? AND user_id = ?`
				, `run`
				, [value, roleId, userId]
			)
		}

		logger.info(`[._limitedShopRoles][User:${userId}] (ITEMID:${roleId})(QTY:${value}) UPDATE:${res.update.stmt.changes} INSERT:${res.insert.stmt.changes} with operation(${operation})`)
		return { stored: true }
	}

	getRemoveByLTSRole(roleId){
		return this._query(`SELECT remove_by FROM limitedShopRoles WHERE user_id = ? AND role_id = ?`,`get`,[this.id,roleId])
	}

	/** -------------------------------------------------------------------------------
	 *  Guild Methods
	 *  -------------------------------------------------------------------------------
	 */

	/**
	 * Fetch guild's configurations in the guild_configurations table.
	 * @param {string} [guildId=``] Target guild id 
	 * @returns {QueryResult}
	 */
	async getGuildConfigurations(guildId=``) {
		return this._query(`
			SELECT * FROM guild_configurations
			WHERE guild_id = ? `
			, `all`
			, [guildId]
		)
	}

	/** -------------------------------------------------------------------------------
	 *  Commands Methods
	 *  -------------------------------------------------------------------------------
	 */

	/**
	 * Fetch most used commands from commands_usage. Descendantly ordered.
	 * @param {number} [limit=5] amount of returned rows
	 * @returns {QueryResult}
	 */
	async mostUsedCommands(limit=5) {
		const fn = `[Database.mostUsedCommands()]`
		if (limit < 0) throw new TypeError(`${fn} parameter "limit" cannot be blank or below zero. Set at least 1.`)
		return this._query(`
			SELECT command_alias, COUNT(command_alias) as total_used
			FROM commands_log
			GROUP BY command_alias
			ORDER BY COUNT(command_alias) DESC
			LIMIT ?`
			, `all`
			, [limit]
			, `Fetching most used commands in commands_log`
		)
	}

	async getDailyCommandUsage(day=30) {
		return this._query(`
			SELECT COUNT(command_alias) as 'command', 
			    strftime('%d-%m-%Y', registered_at) as 'on_date',
			    registered_at 
			FROM commands_log 
		    GROUP by strftime('%d-%m-%Y', registered_at)
		    ORDER BY registered_at DESC
		    LIMIT ?`
		    , `all`
		    , [day]
		)
	}

	getResourceData(day=30) {
		return this._query(`
			SELECT
				uptime,
				ping,
				cpu,
				memory,
			    strftime('%d-%m-%Y', registered_at) AS 'on_date',
			    registered_at 
			FROM resource_log
		    GROUP by strftime('%d-%m-%Y', registered_at)
		    ORDER BY registered_at DESC
			LIMIT ?`
			, `all`
			, [day]
		)
	}

	/**
	 * Get total count of the commands logs from commands_log table.
	 * @returns {number}
	 */
	async getCommandQueryCounts() {
		const res = await this._query(`
			SELECT COUNT(command_alias) AS total
			FROM commands_log`
			, `get`
			, []
			, `Fetching commands_log`
		)
		return res.total
	}


	/** -------------------------------------------------------------------------------
	 *  User's manager methods
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Insert into user table if id is not registered.
	 * @param {string} [userId=``] User's discord id.
	 * @param {string} [userName=``] User's discord name. 
	 * @returns {QueryResult}
	 */
	async verifyingNewUser(userId=``, userName=``) {
		const fn = `[Database.verifyingNewUser()]`
		if (!userId) throw new TypeError(`${fn} parameter "userId" is not provided.`)
		const res = await this._query(`
			INSERT OR IGNORE INTO users (user_id, name)
			VALUES (?, ?)`
			, `run`
			, [userId, userName,]
		)

		if (res.insert) logger.info(`${fn} Registering new USER_ID ${userId}`)
		return res
	}

	/**
	 * Delete a user from user table entries.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	async deleteUser(userId=``) {
		const fn = `[Database.deleteUser()]`
		if (!userId) throw new TypeError(`${fn} parameter "userId" is not provided.`)
		return this._query(`
			DELETE FROM users
			WHERE user_id = ?`
			, `run`
			, [userId]
			, `Deleting USER_ID ${userId} from database`
		)
	}

	/**
	 * Updating user's last_login.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	async updateLastLogin(userId=``) {
		return this._query(`
			UPDATE users
			SET last_login_at = datetime('now')
			WHERE user_id = ?`
			, `run`
			, [userId]
		)
	}	 

	/**
	 * Updating user's bio
	 * @param {string} [bio=``] User's input. Limit 156 character.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	setUserBio(bio=``, userId=``) {
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
	 * Updating user's linked social media
	 * @param {string} [type=``] User's social media type (EXAMPLE: "twitter", "facebook", "kitsu").
	 * @param {string} [url=``] User's social media url.
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	async setUserSocialMedia(type=``, url=``, userId=``) {
		const fn = `[Database.setUserSocialMedia()]`
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
				INSERT INTO user_socialmedias(user_id, account_type, url)
				SELECT $userId, $type, $url
				WHERE NOT EXISTS (SELECT 1 FROM user_socialmedias WHERE user_id = $userId AND account_type = $type)`
				, `run`
				, {userId: userId, type: type, url: url}
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_socialmedias
				SET url = ?, account_type = ?
				WHERE user_id = ?`
				, `run`
				, [url, type, userId]
			)
		}

		const stmtType = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`${fn} ${stmtType} (TYPE:${type})(URL:${url}) | USER_ID ${userId}`)
		return true
	}

	/**
	 * Set user's in_use stickers to zero
	 * @param {string} [userId=``] User's discord id.
	 * @returns {QueryResult}
	 */
	disableSticker(userId=``){
		return this._query(`
			UPDATE user_inventories
			SET in_use = 0
			WHERE 
				user_id = ? 
				AND item_id IN (
					SELECT item_id
					FROM items
					WHERE type = 'STICKERS'
				)`
			, `run`
			, [userId]
		)
	}

	/**
	 * Adding user's reputation points into `user_reputations` table
	 * @param {number} [amount=0] amount to be added
	 * @param {string} [userId=``] target user's discord id
	 * @param {string} [givenBy=null] giver user's discord id. Optional
	 * @returns {QueryResult}
	 */
	addUserReputation(amount=0, userId=``, givenBy=null) {
		return this._query(`
			UPDATE user_reputations 
			SET 
				total_reps = total_reps + ?,
				last_received_at = datetime('now'),
				recently_received_by = ?
			WHERE user_id = ?`
			, `run`
			, [amount, userId, givenBy]
		)
	}

	/**
	 * Updating the timestamp for reputation giver.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	updateReputationGiver(userId=``) {
		return this._query(`
			UPDATE user_reputations 
			SET 
				last_giving_at = datetime('now')
			WHERE user_id = ?`
			, `run`
			, [userId]
		)
	}

	/**
	 * Adds new streak data and updating the timestamp for user dailies.
	 * @param {number} [streak=0] the amount of dailies streak to be set to `user_dailies.total_streak`
	 * @param {string} [user_id=``] target user's discord id
	 * @returns {QueryResult}
	 */
	updateUserDailies(streak=0, userId=``) {
		return this._query(`
			UPDATE user_dailies 
			SET 
				updated_at = datetime('now'),
				total_streak = ?
			WHERE user_id = ?`
			, `run`
			, [streak, userId]
		)
	}

	/**
	 * Converts db's timestamp to local/current machine date.
	 * @param {string} [timestamp=`now`] datetime from sql to be parsed from.
	 * @returns {string}
	 */
	async toLocaltime(timestamp=`now`) {
		const res = await this._query(`
			SELECT datetime(?, 'localtime') AS timestamp`
			, `get`
			, [timestamp]
		)
		return res.timestamp
	}

	/** -------------------------------------------------------------------------------
	 *  User's Experience Points Method
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Pull user's experience points metadata from `user_exp` table
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	getUserExp(userId=``) {
		return this._query(`
			SELECT * FROM user_exp 
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Adding user's experience points into `user_exp` table
	 * @param {number} [amount=0] amount to be added
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	addUserExp(amount=0, userId=``) {
		return this._query(`
			UPDATE user_exp 
			SET current_exp = current_exp + ?
			WHERE user_id = ?`
			, `run`
			, [amount, userId]
		)
	}

	/**
	 * Subtracts user's experience points into `user_exp` table
	 * @param {number} [amount=0] amount to be added
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	subtractUserExp(amount=0, userId=``) {
		return this._query(`
			UPDATE user_exp 
			SET current_exp = current_exp - ?
			WHERE user_id = ?`
			, `run`
			, [amount, userId]
		)
	}

	/**
	 * Reset user exp from user_exp's entries
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	resetUserExp(userId=``) {
		return this._query(`
			DELETE FROM user_exp
			WHERE user_id = ?`
			, `run`
			, [userId]
			, `Resetting exp for USER_ID ${userId}`
		)
	}

	/**
	 * Resetting user exp booster.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	resetUserExpBooster(userId=``) {
		return this._query(`
			UPDATE user_exp
			SET 
				exp_booster = NULL,
				exp_booster_activated_at = NULL
			WHERE userId = ?`
			, `run`
			, [userId]
		)
	}

	/** -------------------------------------------------------------------------------
	 *  Moderation methods
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Pull user's strike records if presents.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getStrikeRecords(userId=``) {
		return this._query(`
			SELECT * FROM strikes
			WHERE user_id = ?`
			, `all`
			, [userId]
			, `Fetching strikes for USER_ID ${userId}`
			, true
		)
	}

	/**
	 * Register a new strike entry for user.
	 * @param {StrikeEntry} meta required parameters to register new strike point
	 * @returns {QueryResult}
	 */
	async registerStrike({user_id=``, reason=`not_provided`, reported_by=``, guild_id=``}) {
		const fn = `[Database.registerStrike]`
		if (!user_id) throw new TypeError(`${fn} property entry.user_id should be filled.`)
		if (!reported_by) throw new TypeError(`${fn} property entry.reported_by should be filled.`)
		if (!guild_id) throw new TypeError(`${fn} property entry.guild_id should be filled.`)
		return this._query(`
			INSERT INTO strikes(
				registered_at,
				user_id,
				reason,
				reported_by,
				guild_id
			)
			VALUES(datetime('now'), ?, ?, ?, ?)`
			, `run`
			, [user_id, reason, reported_by, guild_id]
			, `Registering new strike entry for USER_ID ${user_id}`
		)
	}

	/** -------------------------------------------------------------------------------
	 *  System Logging Methods
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Records command query/usage everytime user uses it.
	 * @param {CommandUsage} meta required parameters
	 * @returns {QueryResult}
	 */
	recordsCommandUsage({guild_id=``, user_id=``, command_alias=``, resolved_in=`0ms` }) {
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
			, `Recording command usage`
		)
	}

	/**
	 * Pull user's main metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUser(userId=``) {
		return this._query(`
			SELECT *
			FROM users
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Pull user's language/locale data
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserLocale(userId=``) {
		return this._query(`
			SELECT lang
			FROM users
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Pull user's inventories metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserInventory(userId=``) {
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
			WHERE user_inventories.user_id = ?`
			, `all`
			, [userId]
		)
	}

	/**
	 * Pull user's dailies metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserDailies(userId=``) {
		return this._query(`
			SELECT *
			FROM user_dailies
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Pull user's reputations metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserReputations(userId=``) {
		return this._query(`
			SELECT *
			FROM user_reputations
			WHERE user_id = ?`
			, `get`
			, [userId]
		)
	}

	/**
	 * Pull user's social media metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserSocialMedia(userId=``) {
		return this._query(`
			SELECT *
			FROM user_socialmedias
			WHERE user_id = ?`
			, `all`
			, [userId]
		)
	}

	/**
	 * Pull user's posts metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserPosts(userId=``) {
		return this._query(`
			SELECT *
			FROM user_posts
			WHERE user_id = ?`
			, `all`
			, [userId]
		)
	}

	/**
	 * Pull user's recent post. Only fetch one row.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserRecentPost(userId=``) {
		return this._query(`
			SELECT *
			FROM user_posts
			WHERE user_id = ?
			ORDER BY registered_at DESC`
			, `get`
			, [userId]
		)
	}

	/**
	 * Pull user's total likes from aggregated data in `user_posts` table
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserTotalLikes(userId=``) {
		return this._query(`
			SELECT SUM(total_likes)
			FROM user_posts
			WHERE user_id = ?`
			, `all`
			, [userId]
		)
	}	

	/**
	 * Pull the most recent trending post. Fetched `10 rows` at a time.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getRecentlyTrendingPost(userId=``) {
		return this._query(`
			SELECT *
			FROM user_posts
			ORDER BY updated_at DESC
			LIMIT 10`
			, `get`
			, [userId]
		)
	}

	/**
	 * Registering new user's post
	 * @param {UserPost} meta required parameters to register the entry
	 * @returns {QueryResult}
	 */
	registerPost({userId=``, url=``, caption=``, channelId=``, guildId=``}) {
		return this._query(`
			INSERT INTO user_posts (
				user_id,
				url,
				caption,
				channel_id,
				guild_id
			)
			VALUES (
				?, ?, ?, ?, ?
			)`,
			`run`
			, [userId, url, caption, channelId, guildId]
		)
	}

	/**
	 * Sending 10 chocolate boxes to the user's inventory
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	sendTenChocolateBoxes(userId=``) {
		return this.updateInventory({itemId: 81, value:10, operation:`+`, userId})	
	}

	/**
	 * Pull any item metadata from `items` table. Supports dynamic search.
	 * @param {ItemKeyword} keyword ref to item id, item name or item alias.
	 * @returns {QueryResult}
	 */
	getItem(keyword=``) {
		return this._query(`
			SELECT 

				items.item_id AS item_id,
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

			FROM items
			INNER JOIN item_types
				ON item_types.type_id = items.type_id
			INNER JOIN item_rarities
				ON item_rarities.rarity_id = items.rarity_id

			WHERE 
				items.item_id = $keyword
				OR lower(items.name) = lower($keyword)
				OR lower(items.alias) = lower($keyword)
			LIMIT 1`
			, `get`
			, {keyword: keyword}	
			, `Looking up for an item with keyword "${keyword}"`
		)
	}

	/**
	 * Fetch purchasable items in the shop table.
	 * @param {string} [sortBy=`items.type_id`] ordering array by given column
	 * @returns {QueryResult}
	 */
	getPurchasableItems(sortBy=`items.type_id`) {
		return this._query(`
			SELECT 

				shop.item_id AS item_id,
				shop.item_price_id AS item_price_id,
				(SELECT alias FROM items WHERE item_id = shop.item_price_id) AS item_price_alias,
				shop.price AS price,

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

			FROM shop
			INNER JOIN items
				ON items.item_id = shop.item_id
			INNER JOIN item_types
				ON item_types.type_id = items.type_id
			INNER JOIN item_rarities
				ON item_rarities.rarity_id = items.rarity_id

			ORDER BY ? DESC`
			, `all`
			, [sortBy]	
			, `Looking up for purchasable items`
		)
	}

	/**
	 * Fetch items from `item_gacha` table.
	 * @returns {QueryResult}
	 */
	getGachaRewardsPool() {
		return this._query(`
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
				ON item_rarities.rarity_id = items.rarity_id`
			, `all`
			, []	
			, `Fetching gacha's rewards pool`
		)
	}

	/**
	 * 	Nullify user's exp booster in `user_exp` table.
	 *  @param {string} [userId=``] target user's id to be nullified to
	 *  @returns {QueryResult}
	 */
	nullifyExpBooster(userId=``) {
		return this._query(`
			UPDATE user_exp 
            SET 
            	booster_id = NULL,
            	booster_activated_at = NULL
            WHERE user_id = ?`
            , `run`
            , [userId]
            , `EXP booster for USER_ID ${userId} has been nullified.`
        )
	}

	/**
	 * 	Event Manager toolkit. Sending package of reward to user. Supports method chaining.
	 * 	@param {Number|UserArtcoins} artcoins ac
	 *  @param {Number|UserGachaTicket} lucky_ticket ticket
	 *  @deliverRewardItems
	 */
	async deliverRewardItems({artcoins, candies, lucky_ticket}) {
		((new Date()).getMonth() == 9) ? await this.storeCandies(candies) : await this.storeArtcoins(artcoins)
		await this.addLuckyTickets(lucky_ticket)
		return this
	}

	/**
	 * 	Add user artcoins. Supports method chaining.
	 * 	@param {Number} value of the artcoins to be given
	 * 	@param {String|ID} userId of the user id
	 * 	@storeArtcoins
	 */
	async storeCandies(value) {
		await this.updateInventory({ itemId: 102, value: value, operation: `+` })
		return this
	}


	updateSkin(newvalue) {
		sql.run(`UPDATE userdata 
            SET interfacemode ="${newvalue}" 
            WHERE userId = ${this.id}`)
	}

	get getStickers() {
		return this._query(`SELECT * FROM itemlist,item_inventory 
			WHERE itemlist.itemId = item_inventory.item_id AND item_inventory.user_id = ? AND itemlist.type = ?`
			, `all`
			, [this.id, `Sticker`]
		)
	}

	get activeSticker() {
		return this._query(`SELECT sticker
			FROM userdata
			WHERE userId = ?`
			, `get`
			, [this.id]
		)
	}

	setSticker(data) {
		return this._query(`UPDATE userdata 
            SET sticker = ?
			WHERE userId = ?
		`
		,`run`
		,[data,this.id])
	}

	setBadge({slot = `slot1`, item = null}){
		return this._query(`UPDATE userbadges 
            SET ${slot} = ?
			WHERE userId = ?
		`
			, `run`
			, [item, this.id])
	}

	get getCovers() {
		return this._query(`SELECT * FROM itemlist,item_inventory 
			WHERE itemlist.itemId = item_inventory.item_id AND item_inventory.user_id = ? AND itemlist.type = ?`
			, `all`
			, [this.id, `Covers`]
		)
	} 

	get getBadges() {
		return this._query(`SELECT * FROM itemlist,item_inventory 
			WHERE itemlist.itemId = item_inventory.item_id AND item_inventory.user_id = ? AND itemlist.type = ?`
			, `all`
			, [this.id, `Badges`]
		)
	}

	get activeCover(){
		return this._query(`SELECT cover
			FROM userdata
			WHERE userId = ?`
			,`get`
			,[this.id]
			)
	}

	get activeBadges() {
		return this._query(`SELECT *
			FROM userbadges
			WHERE userId = ?`
			, `get`
			, [this.id]
		)
	}

	setCover(data){
		this._query(`UPDATE userdata 
            SET cover = ?
			WHERE userId = ?`
			,`run`
			,[data,this.id])
	}

	updateCover(newvalue) {
		sql.run(`UPDATE userdata 
            SET cover = "${newvalue.alias}"
			WHERE userId = ${this.id}`)
		this._transforInventory({ itemId: newvalue.itemId })
	}

	updateSticker(newvalue){
		sql.run(`UPDATE userdata 
            SET sticker = "${newvalue.alias}"
			WHERE userId = ${this.id}`)
		this._transforInventory({ itemId: newvalue.itemId })
	}

	async stickerTheme(data){
		let res = await this._query(`SELECT *
			FROM itemlist
			WHERE alias = ?`
			,`get`
			,[data]
		).then(async parsed => parsed)
		let theme = res == undefined ? false : res.unique_type == `-` ? false : true
		return theme
	}


	async updateBadge(newvalue) {
		let badgedata = await this.userBadges()
		let slotkey = Object.keys(badgedata)
		let slotvalue = Object.values(badgedata)
		sql.run(`UPDATE userbadges 
            SET ${slotkey[slotvalue.indexOf(null)]} = "${newvalue.alias}" 
			WHERE userId = ${this.id}`)
		this._transforInventory({ itemId: newvalue.itemId})
	}

	/**
	 * 	Updating dailies metadata. Supports method chaining.
	 * 	@param {Object} dly_metadata returned metadata from daily.js
	 *  @updateDailies
	 */
	updateDailies(dly_metadata) {
		//  Update daily date
		this._query(`
			UPDATE usercheck
            SET totaldailystreak = ${dly_metadata.countStreak},
            lastdaily = "${Date.now()}"
			WHERE userId = ?`
			, `run`
			, [this.id]
		)
		//  Update dailies reward
		this.storeArtcoins(dly_metadata.amount + dly_metadata.bonus)
		return this
	}


	async updateReps(dly_metadata) {
		//  Update daily date
		sql.run(`UPDATE usercheck
                     SET repcooldown = "${Date.now()}"
                     WHERE userId = ${this.id}`)

		await this.addReputations(dly_metadata.amount, dly_metadata.target_id)
	}

	resetExperiencePoints(id = this.id) {
		this._query(`
                UPDATE userdata
                SET currentexp = 0
                WHERE userId = ?`
            ,`run`
            , [id])
	}


	/**
	 * 	Delete user inventory entries. Supports method chaining.
	 * 	@resetInventory
	 */
	resetInventory() {
		this._query(`
			DELETE FROM item_inventory
			WHERE user_id = ?`
			, `run`
			, [this.id]
		)
		return this
	}


	/**
	 * 	Withdrawing specific item from user inventory. Supports method chaining.
	 * 	@param {Number} value as amount to be withdraw
	 * 	@param {Number} item_id as item id reference
	 * 
	 */
	async withdrawItem(value, item_id) {
		await this._query(`
			UPDATE item_inventory 
            SET quantity = quantity - ?
			WHERE item_id = ? AND user_id = ?`
			, `run`
			, [value, item_id, this.id]
		)
		return this
	}


	/**
	 * 	Set default db author. Supports method chaining.
	 * 	@param {String|ID} id user id
	 * 	@setUser
	 */
	setUser(id) {
		this.id = id
		return this
	}

	registerDailyFeaturedPost({ messageId ,timestamp = 0 }) {
		sql.run(`
                INSERT INTO daily_featured_post
                (message_id, delete_by)
                VALUES (?, ?)`,
			[messageId, timestamp]
		)
	}

	getRemoveBy(remove_by_date){
		return this._query(`SELECT * FROM daily_featured_post WHERE delete_by <= ?`,`all`,[remove_by_date])
	}

	deleteRecord(remove_by_date){
		return this._query(`DELETE FROM daily_featured_post WHERE delete_by <= ?`,`run`,[remove_by_date])
	}

	get luckyTicketDropRates() {
		return sql.all(`SELECT DISTINCT drop_rate FROM luckyticket_rewards_pool WHERE availability = 1`)
	}

	get halloweenBoxDropRates() {
		return sql.all(`SELECT DISTINCT drop_rate FROM halloween_rewards_pool WHERE availability = 1`)
	}

	lootGroupByRate(rate, table = `luckyticket_rewards_pool`) {
		return sql.get(`SELECT * FROM ${table} WHERE drop_rate = ${rate} AND availability = 1 ORDER BY RANDOM()`)
	}

	lootGroupByRateForHalloween(rate, table = `luckyticket_rewards_pool`) {
		return sql.all(`SELECT * FROM ${table} WHERE drop_rate = ${rate} AND availability = 1 ORDER BY RANDOM() LIMIT 2`)
	}

	/**
     * Subtracting tickets by result of roll_type().
	 * @param {Number} value amount to be subtracted
     * @substract_ticket
    */
	withdrawLuckyTicket(value = 0) {
		this.updateInventory({itemId: 71, value: value, operation:`-`})
	}

	/**
     * Subtracting halloween box by result of roll_type().
	 * @param {Number} value amount to be subtracted
     * @substract_ticket
    */
	withdrawHalloweenBox(value = 0) {
		this.updateInventory({ itemId: 111, value: value, operation: `-` })
	}

	/**
     * Subtracting halloween bags by result of roll_type().
	 * @param {Number} value amount to be subtracted
     * @substract_ticket
    */
	withdrawHalloweenBag(value = 0) {
		this.updateInventory({ itemId: 110, value: value, operation: `-` })
	}

	/**
     * Subtracting halloween bags by result of roll_type().
	 * @param {Number} value amount to be subtracted
     * @substract_ticket
    */
	withdrawHalloweenChest(value = 0) {
		this.updateInventory({ itemId: 109, value: value, operation: `-` })
	}

	//	Count total user's collected cards.
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
     *  Storing rolled items straight into user inventory
     *  @param {Object} obj as parsed object of roll metadata (require baking in `._detransformInventory()`).
	 *  @param {String|ID} userid for userId consistency, better to insert the id.
     */
	async storingUserGachaMetadata(obj = {}, userid=this.id) {
		for (let key in obj) {
			let data = obj[key]
			await this.updateInventory({itemId: data.itemId, value: data.quantity, userId:userid})
		}
	}

	/**
     *  Storing rolled items straight into user inventory
     *  @param {Object} obj as parsed object of roll metadata (require baking in `._detransformInventory()`).
	 *  @param {String|ID} userid for userId consistency, better to insert the id.
     */
	async withdrawUserCraftMetadata(obj = {}, userid = this.id) {
		for (let key in obj) {
			let data = obj[key]
			await this.updateInventory({ itemId: data.itemId, value: data.quantity, operation:`-`, userId: userid })
		}
	}

	/**
     * Adding user reputation points
     * @param {Integer} amount Updated/added amount of user's reputation points
     */
	addReputations(amount = 0, userId = this.id) {
		return this.client.run(`UPDATE userdata
                            SET reputations = CASE WHEN reputations IS NULL
                                                THEN ${amount}
                                              ELSE reputations + ${amount}
                                            END
                            WHERE userId = "${userId}"`)
	}

	/**
	* Enables user's notification. User will start receive notifications after executing it
	* @param {number} [amount=0] amount of like to be registered
	* @param {string} [postUrl=``] of source post url
	* @param {string} [userId=``] of target user id
	* @returns {QueryResult}
	*/
	addLike(amount=``, postUrl=``, userId=``) {
		return this._query(`
            UPDATE user_posts 
            SET total_likes = total_likes + ? 
			WHERE url = ? AND user_id = ?`
			, `run`
			, [amount, postUrl, userId]
			, `USER_ID ${userId} receives ${amount} likes`	
		)
	}

	/**
	* Enables user's notification. User will start receive notifications after executing it.
	* @param {string} [userId=``] of target user id
	* @returns {QueryResult}
	*/
	enableNotification(userId=``) {
		return this._query(`
			UPDATE user
			SET receive_notification = 1
			WHERE id = ?`
			, `run`
			, [userId]
		)
	}

	/**
	* Enables user's notification. User will start receive notifications after executing it.
	* @param {string} [userId=``] of target user id
	* @returns {QueryResult}
	*/
	disableNotification(userId=``) {
		return this._query(`
			UPDATE user
			SET receive_notification = 0
			WHERE id = ?`
			, `run`
			, [userId]
		)
	}
        
	//  Check if post already stored in featured list
	featuredPostMetadata(url) {
		return this.client.get(`
                SELECT *
                FROM featured_post
                WHERE url = "${url}"
            `)
	}

	//  Register new featured post metadata
	registerFeaturedPost({timestamp=0, url=``, author=``, channel=``, heart_counts=0, last_heart_timestamp=Date.now()}) {
		this.client.run(`
                INSERT INTO featured_post
                (timestamp, url, author, channel, heart_counts, last_heart_timestamp)
                VALUES (?, ?, ?, ?, ?, ?)`,
		[timestamp, url, author, channel, heart_counts, last_heart_timestamp]
		)
	}

	/**
	* Pull ID ranking based on given descendant column order.
	* @param {string} [group=``] of target category
	* @returns {QueryResult}
	*/
	async indexRanking(group=``) {

		if (group === `exp`) return this._query(`
			SELECT user_id AS id, current_exp AS points FROM user_exp
			ORDER BY current_exp DESC`
			, `all`
			, []
			, `Fetching exp leaderboard`
			, true	
		)

		if (group === `artcoins`) return this._query(`
			SELECT user_id AS id, quantity AS points FROM user_inventories
			WHERE item_id = 52
			ORDER BY quantity DESC`
			, `all`
			, []
			, `Fetching artcoins leaderboard`
			, true	
		)

		if (group === `fame`) return this._query(`
			SELECT user_id AS id, total_reps AS points FROM user_reputations
			ORDER BY total_reps DESC`
			, `all`
			, []
			, `Fetching fame leaderboard`
			, true	
		)

		if (group === `artists`) return this._query(`
			SELECT userId AS id, liked_counts AS points FROM userdata
			ORDER BY liked_counts DESC`
			, `all`
			, []
			, `Fetching artists leaderboard`
			, true	
		)
	}

	/** -------------------------------------------------------------------------------
	 *  Limited Shop & Events Methods
	 *  @todo
	 *  * REQUIRE UPDATES @Bait_God
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Delete row data from given table.
	 * @param tablename of target table.
	 * @param id of userId
	 * @param idtype of the id type.
	 */
	removeRowDataFromEventData(id, idtype = `name`, time) {
		return sql.run(`DELETE FROM event_data WHERE active = 1 AND ${idtype} = '${id}' AND start_time = ${time} AND repeat_after = 0`).then(() => {
			return logger.info(`Event: ${id} with start time of: ${time} has been deleted from the database.`)
		})
	}

	updateEventDataActiveToOne(id, time){
		return sql.run(`UPDATE event_data SET active = 1 WHERE name = '${id}' and start_time = ${time}`)
	}

	updateRowDataFromEventData(set, where){
		return sql.run(`UPDATE event_data SET ${set} WHERE ${where}`)
	}

	/**
			*   Pull data from event_data table.
			* @param tablename of target table.
			* @param id of userId
			*/
	pullEventData() {
		return sql.all(`SELECT * FROM event_data WHERE NOT category = 'weekly' ORDER BY start_time`).then(async parsed => parsed)
	}

	get retrieveTimeData(){
		let dateRightNow = (new Date()).getTime()
		let foreverDate = (new Date(`Jan 5, 2021 15:37:25`)).getTime()
		return this._query(`SELECT * 
			FROM limitedShopRoles 
			WHERE remove_by != ? AND remove_by <= ? 
			ORDER BY remove_by ASC LIMIT 50`
			,`all`
			,[foreverDate,dateRightNow])
	}

	/**
	 * Fetch user's relationship info
	 * @param {string} [userId=``] target user id
	 * @returns {QueryResult}
	 */
    getUserRelations(userId=``) {
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
				AND user_relationships.relationship_id IS NOT NULL`
			, `all`
			, [userId]
		)
    }

	/**
	 * Pull available relationship types
	 * @returns {QueryResult}
	 */
    getAvailableRelationships() {
		return this._query(`
			SELECT * FROM relationships
			ORDER BY relationship_id ASC`
			, `all`	
		)
    }

	/**
	 * Registering new user's relationship
	 * @param {string} [userA=``] Author's user id
	 * @param {string} [userB=``] Target user's id to be assigned
	 * @param {number} [relationshipId=0] assigned relationship's role id
	 * @returns {QueryResult}
	 */
    async setUserRelationship(userA=``, userB=``, relationshipId=0) {
		const fn = `[Database.setUserRelationship()]`
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
	            INSERT INTO user_relationships (user_id_A, user_id_B, relationship_id)
				SELECT $userA, $userB, $relationshipId
				WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id_A = $userA AND user_id_B = $userB)`
				, `run`
				, {userA: userA, userB: userB, relationshipId: relationshipId}	
				, `Registering new relationship for ${userA} and ${userB}`
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

	/**
	 * Removing user's relationship
	 * @param {string} [userA=``] Author's user id.
	 * @param {string} [userB=``] Target user's id to be assigned.
	 * @returns {QueryResult}
	 */
    removeUserRelationship(userA=``, userB=``) {
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

	/** -------------------------------------------------------------------------------
	 *  Pre-V6 Migrations Methods
	 *  -------------------------------------------------------------------------------
	 */	


	/**
	 * Drop V6 Tables
	 * @returns {boolean}
	 */
	async dropTables() {
		logger.info(`Dropping temp v6 tables.. this may take a minute...`)
		await this._query(`DROP TABLE IF EXISTS users`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_dailies`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_reputations`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_exp`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_posts`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_inventories`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_socialmedias`, `run`)
		await this._query(`DROP TABLE IF EXISTS user_relationships`, `run`)
		await this._query(`DROP TABLE IF EXISTS relationships`, `run`)
		await this._query(`DROP TABLE IF EXISTS items`, `run`)
		await this._query(`DROP TABLE IF EXISTS item_gacha`, `run`)
		await this._query(`DROP TABLE IF EXISTS item_types`, `run`)
		await this._query(`DROP TABLE IF EXISTS item_rarities`, `run`)
		await this._query(`DROP TABLE IF EXISTS shop`, `run`)
		await this._query(`DROP TABLE IF EXISTS strikes`, `run`)
		await this._query(`DROP TABLE IF EXISTS commands_log`, `run`)
		await this._query(`DROP TABLE IF EXISTS resource_log`, `run`)
		return true
	}

	/**
	 * Validate and Create V6 Table Schemas
	 * @returns {boolean}
	 */
	async verifyingTables() {
		/**
		 * --------------------------
		 * USER TREE
		 * --------------------------
		 */
	   await this._query(`CREATE TABLE IF NOT EXISTS users (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_login_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'name' TEXT,
		   'bio' TEXT DEFAULT "Hi! I'm a new user!",
		   'verified' INTEGER DEFAULT 0,
		   'lang' TEXT DEFAULT 'en',
		   'receive_notification' INTEGER DEFAULT -1

		   )`
		   , `run`
		   , []
		   , `Verifying table users`
	   )
	   
	   await this._query(`CREATE TABLE IF NOT EXISTS user_dailies (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'total_streak' INTEGER DEFAULT 0,

		   FOREIGN KEY(user_id)
		   REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table user_dailies`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_reputations (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_giving_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_received_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'total_reps' INTEGER DEFAULT 0,
		   'recently_received_by' TEXT,

		   FOREIGN KEY(user_id) 
		   REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table user_reputations`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_exp (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'current_exp' INTEGER DEFAULT 0,
		   'booster_id' INTEGER,
		   'booster_activated_at' TIMESTAMP,

		   FOREIGN KEY(user_id) 
		   REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE

		   FOREIGN KEY(booster_id) 
		   REFERENCES items(item_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table user_exp`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_inventories (
		   
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT,
			'item_id' INTEGER,
			'quantity' INTEGER DEFAULT 0,
			'in_use' INTEGER DEFAULT 0,

			PRIMARY KEY (user_id, item_id),

			FOREIGN KEY(user_id) 
			REFERENCES users(user_id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE,

			FOREIGN KEY(item_id) 
			REFERENCES items(item_id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE

			)`
			, `run`
			, []
			, `Verifying table user_inventories`
		)

	   await this._query(`CREATE TABLE IF NOT EXISTS user_posts (

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

		   )`
		   , `run`
		   , []
		   , `Verifying table user_posts`
	   )
	   
	   await this._query(`CREATE TABLE IF NOT EXISTS user_socialmedias (

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

		   )`
		   , `run`
		   , []
		   , `Verifying table user_socialmedias`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_relationships (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id_A' TEXT,
		   'user_id_B' TEXT,
		   'relationship_id' TEXT,

		   PRIMARY KEY(user_id_A, user_id_B),

		   FOREIGN KEY(user_id_A)
		   REFERENCES users(user_id)
		   		ON DELETE CASCADE
		   		ON UPDATE CASCADE

		   FOREIGN KEY(user_id_B)
		   REFERENCES users(user_id)
		   		ON DELETE CASCADE
		   		ON UPDATE CASCADE

		   FOREIGN KEY(relationship_id)
		   REFERENCES relationships(relationship_id)
		   		ON DELETE CASCADE
		   		ON UPDATE CASCADE
		   )`
		   , `run`
		   , []
		   , `Verifying table user_relationships`
	   )

	   /*
	   await this._query(`CREATE TABLE IF NOT EXISTS user_quest_data (
		   'user_id' TEXT NOT NULL UNIQUE,
		   'quest_key' INTEGER,
		   'quest_level' INTEGER)`
		   , `run`
		   , []
		   , `Verifying table user_quest_info`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_quests (
		   'user_id' TEXT NOT NULL,
		   'quest_id' INTEGER,
		   'status' INTEGER,
		   'date_completed' TIMESTAMP)`
		   , `run`
		   , []
		   , `Verifying table user_quests`
	   )
	   */

	   /**
		* --------------------------
		* GUILD TREES
		* --------------------------
		*/
	   await this._query(`CREATE TABLE IF NOT EXISTS guilds (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'guild_id' TEXT PRIMARY KEY,
		   'name' TEXT,
		   'bio' TEXT

		   )`
		   , `run`
		   , []
		   , `Verifying table guilds`
	   )	

	   await this._query(`CREATE TABLE IF NOT EXISTS guild_configurations (

			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'config_id' INTEGER PRIMARY KEY AUTOINCREMENT,
			'config_code' TEXT,
			'guild_id' TEXT,
			'channel_id' TEXT,
			'set_by_user_id' TEXT,

			FOREIGN KEY(guild_id)
			REFERENCES guilds(guild_id)
				ON DELETE CASCADE
				ON UPDATE CASCADE

			FOREIGN KEY(set_by_user_id)
			REFERENCES users(user_id)
		   		ON UPDATE CASCADE
				ON DELETE SET NULL

			)`
			, `run`
			, []
			, `Verifying table guild_configurations`
		)	

	   /**
		* --------------------------
		* RELATIONSHIP TREES
		* --------------------------
		*/
	   await this._query(`CREATE TABLE IF NOT EXISTS relationships (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'relationship_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'name' TEXT

		   )`
		   , `run`
		   , []
		   , `Verifying table relationships`
	   )

	   /**
		* --------------------------
		* ITEMS TREES
		* --------------------------
		*/
	   await this._query(`CREATE TABLE IF NOT EXISTS items (

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

		   )`
		   , `run`
		   , []
		   , `Verifying table items`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS item_gacha (

		   'gacha_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'item_id' INTEGER,
		   'quantity' INTEGER DEFAULT 1,
		   'weight' REAL,

			FOREIGN KEY(item_id)
			REFERENCES items(item_id)
				ON DELETE CASCADE
				ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table item_gacha`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS item_types (

		   'type_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'name' TEXT,
		   'alias' TEXT,
		   'max_stacks' INTEGER DEFAULT 9999,
		   'max_use' INTEGER DEFAULT 9999

		   )`
		   , `run`
		   , []
		   , `Verifying table item_types`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS item_rarities (

		   'rarity_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'name' TEXT,
		   'level' INTEGER UNIQUE,
		   'color' TEXT DEFAULT '#000000'

		   )`
		   , `run`
		   , []
		   , `Verifying table item_rarities`
	   )

		/**
		 * --------------------------
		 * SHOP TREES
		 * --------------------------
		 */
	   await this._query(`CREATE TABLE IF NOT EXISTS shop (

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

		   )`
		   , `run`
		   , []
		   , `Verifying table shop`
	   )

		/**
		 * --------------------------
		 * MODERATION TREES
		 * --------------------------
		 */
	   await this._query(`CREATE TABLE IF NOT EXISTS strikes (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'strike_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'user_id' TEXT,
		   'guild_id' TEXT,
		   'reported_by' TEXT,
		   'reason' TEXT DEFAULT "Not provided"

		   )`
		   , `run`
		   , []
		   , `Verifying table strikes`
	   )

		/**
		 * --------------------------
		 * LOG TREES
		 * --------------------------
		 */
	   await this._query(`CREATE TABLE IF NOT EXISTS commands_log (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'user_id' TEXT,
		   'channel_id' TEXT,
		   'guild_id' TEXT,
		   'command_alias' TEXT,
		   'resolved_in' TEXT

		   )`
		   , `run`
		   , []
		   , `Verifying table commands_log`
	   )
	   await this._query(`CREATE TABLE IF NOT EXISTS resource_log (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'log_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'uptime' INTEGER,
		   'ping' REAL,
		   'cpu' REAL,
		   'memory' REAL

		   )`
		   , `run`
		   , []
		   , `Verifying table resource_log`
	   )
	   return true
   }	

	/**
	 * Migrating old db entries into V6's tables
	 * @returns {boolean}
	 */
	async migrate() {


		/**
		 * ---------------------------------------------------------
		 * Registering item types
		 * ---------------------------------------------------------
		 */
		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Covers', 'cov')`
			, `run`
			, []
			, `Register Covers type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Badges', 'bgs')`
			, `run`
			, []
			, `Register Badges type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Stickers', 'stc')`
			, `run`
			, []
			, `Register Stickers type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Themes', 'thm')`
			, `run`
			, []
			, `Register Themes type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias, max_stacks)
			VALUES('Currencies', 'crcy', 9999999999)`
			, `run`
			, []
			, `Register Currencies type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Tickets', 'tkt')`
			, `run`
			, []
			, `Register Tickets type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Materials', 'mtrl')`
			, `run`
			, []
			, `Register Materials type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Consumables', 'cnsm')`
			, `run`
			, []
			, `Register Consumables type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Cards', 'crd')`
			, `run`
			, []
			, `Register Cards type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Gifts', 'gft')`
			, `run`
			, []
			, `Register Gifts type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Gachas', 'gch')`
			, `run`
			, []
			, `Register Gachas type in item_types table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_types(name, alias)
			VALUES('Packages', 'pkg')`
			, `run`
			, []
			, `Register Packages type in item_types table`
		)

		/**
		 * ---------------------------------------------------------
		 * Registering item rarities
		 * ---------------------------------------------------------
		 */
		await this._query(`
			INSERT OR IGNORE INTO item_rarities(name, level, color)
			VALUES('Common', 1, '#888A91')`
			, `run`
			, []
			, `Register [1]Common rarity in item_rarities table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_rarities(name, level, color)
			VALUES('Magic', 2, '#68B73E')`
			, `run`
			, []
			, `Register [2]Magic rarity in item_rarities table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_rarities(name, level, color)
			VALUES('Rare', 3, '#99BCBF')`
			, `run`
			, []
			, `Register [3]Rare rarity in item_rarities table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_rarities(name, level, color)
			VALUES('Unique', 4, '#C21CFF')`
			, `run`
			, []
			, `Register [4]Unique rarity in item_rarities table`
		)

		await this._query(`
			INSERT OR IGNORE INTO item_rarities(name, level, color)
			VALUES('Legendary', 5, '#AD3632')`
			, `run`
			, []
			, `Register [5]Legendary rarity in item_rarities table`
		)


		/**
		 * ---------------------------------------------------------
		 * Migrating and updating table items
		 * ---------------------------------------------------------
		 */

		await this._query(`
			DELETE FROM itemlist 
			WHERE type IN ('Roles', 'Seasonal Roles')`
			, `run`
			, []
			, `Deleting item with 'Roles' and 'Seasonal Roles' type in itemlist table`
		)

		await this._query(`
			UPDATE itemlist 
			SET type = 'Badges'
			WHERE type = 'Package Items'`
			, `run`
			, []
			, `Updating 'Package Items' type into 'Badges' in itemlist table`
		)

		await this._query(`
			UPDATE itemlist 
			SET type = 'Currencies'
			WHERE type = 'Currency'`
			, `run`
			, []
			, `Updating 'Currency' type into 'Currencies' in itemlist table`
		)

		await this._query(`
			UPDATE itemlist 
			SET type = 'Materials'
			WHERE type in ('Unique', 'Shard')`
			, `run`
			, []
			, `Updating 'Unique' and 'Shard' type into 'Materials' in itemlist table`
		)

		await this._query(`
			UPDATE itemlist 
			SET type = 'Gifts'
			WHERE type = 'Foods'`
			, `run`
			, []
			, `Updating 'Foods' type into 'Gifts' in itemlist table`
		)

		await this._query(`
			UPDATE itemlist 
			SET type = 'Consumables'
			WHERE type = 'Capsule'`
			, `run`
			, []
			, `Updating 'Capsule' type into 'Consumables' in itemlist table`
		)

		await this._query(`
			INSERT INTO items (
				item_id,
				name,
				alias,
				rarity_id,
				type_id,
				description
			) 
			SELECT 
				itemId,
				name,
				alias,
				(SELECT rarity_id FROM item_rarities WHERE itemlist.rarity = item_rarities.level),
				(SELECT type_id FROM item_types 
				WHERE 
					UPPER(itemlist.type) = UPPER(item_types.name)
					OR UPPER(itemlist.type) || 'S' = UPPER(item_types.name)
				),
				desc
			FROM itemlist`
			, `run`
			, []
			, `Migrating itemlist into items`
		)	

		await this._query(`
			INSERT INTO items (
				name,
				alias,
				rarity_id,
				type_id,
				description
			) 
			VALUES (
				'Annie is bored!',
				'defaultcover1',
				1,
				(SELECT type_id FROM item_types WHERE name = 'Covers'),
				'Looks! Annie is disappointed looking at your boring profile.'
			)`
			, `run`
			, []
			, `Registering defaultcover1 into items table`
		)	

		await this._query(`
			UPDATE items 
			SET 
				name = 'Light Profile Theme',
				description = 'Delightful. Pure. Clean slate color for your profile card.',
				type_id = (SELECT type_id FROM item_types WHERE name = 'Themes')
			WHERE alias = 'light'`
			, `run`
			, []
			, `Updating [Light Profile Theme] in items table`
		)	

		await this._query(`
			UPDATE items 
			SET 
				name = 'Dark Profile Theme',
				description = 'Its time to take care of your eyes with dark themed profile.',
				type_id = (SELECT type_id FROM item_types WHERE name = 'Themes')
			WHERE alias = 'dark'`
			, `run`
			, []
			, `Updating [Dark Profile Theme] in items table`
		)

		await this._query(`
			UPDATE item_types 
			SET max_use = 1
			WHERE name in (
				'COVERS',
				'THEMES',
				'STICKERS'
			)`
			, `run`
			, []
			, `Updating decoration(except badges) item's max_use to 1 in item_types table`
		)

		await this._query(`
			UPDATE items 
			SET alias = 'lalolu_cov' 
			WHERE name = 'Lalolu'`
			, `run`
			, []
			, `Fixing Lalolu's Cover alias`
		)	

		await this._query(`
			UPDATE usercheck 
			SET lastdaily = datetime(lastdaily/1000, 'unixepoch')`
			, `run`
			, []
			, `Converting usercheck's lastdaily into a proper datetime`
		)
		await this._query(`
			UPDATE usercheck 
			SET repcooldown = datetime(repcooldown/1000, 'unixepoch')`
			, `run`
			, []
			, `Converting usercheck's repcooldown into a proper datetime`
		)		
		await this._query(`
			INSERT INTO users (
				last_login_at,
				user_id,
				bio,
				receive_notification
			) 
			SELECT 
				last_login,
				userId, 
				description,
				get_notification
			FROM userdata`
			, `run`
			, []
			, `Migrating userdata into users`
		)

		await this._query(`
			INSERT INTO user_dailies (
				updated_at,
				user_id,
				total_streak
			) 
			SELECT 
				usercheck.lastdaily,
				users.user_id,
				usercheck.totaldailystreak
			FROM usercheck, users
			WHERE users.user_id = usercheck.userId`
			, `run`
			, []
			, `Migrating usercheck's dailies into user_dailies`
		)
		await this._query(`
			INSERT INTO user_reputations (
				user_id,
				total_reps
			)
			SELECT 
				userId, 
				reputations
			FROM userdata`
			, `run`
			, []
			, `Migrating userdata's reps into user_reputations`
		)
		await this._query(`
			INSERT INTO user_exp (
				user_id,
				current_exp,
				booster_id,
				booster_activated_at
			) 
			SELECT 
				usercheck.userId user_id,
				userdata.currentexp current_exp,
				(SELECT item_id FROM items WHERE alias = usercheck.expbooster),
				usercheck.expbooster_duration
			FROM usercheck, userdata
			WHERE usercheck.userId = userdata.userId`
			, `run`
			, []
			, `Migrating userdata and usercheck exp data into user_exp`
		)
		await this._query(`
			INSERT INTO user_posts (
				registered_at,
				user_id,
				url,
				caption,
				guild_id,
				recently_liked_by
			) 
			SELECT 
				(SELECT datetime(timestamp / 1000, 'unixepoch')),
				userartworks.userId,
				userartworks.url,
				userartworks.description,
				459892609838481408,
				230034968515051520
			FROM userartworks, users
			WHERE users.user_id = userartworks.userId`
			, `run`
			, []
			, `Migrating userartworks into user_posts`
		)

		/**  --------------------------
		  *  Remove non-existent userId in userbadges (deprecated) table.
		  *  --------------------------
		  */
		await this._query(`
			DELETE FROM userbadges
			WHERE userId NOT IN (
				SELECT user_id 
				FROM users
			)`
			, `run`
			, []
			, `Remove non-existent userId in userbadges (deprecated) table.`
		)

		/**  --------------------------
		  *  Delete duplicate items in item_inventory.
		  *  --------------------------
		  */
		await this._query(`
			DELETE FROM item_inventory
			WHERE rowid NOT IN (
				SELECT min(rowid)
				FROM item_inventory
				GROUP BY item_id, user_id
			)`
			, `run`
			, []
			, `Remove duplicate items in item_inventory.`
		)

		/**  --------------------------
		  *  USER INVENTORIES
		  *  --------------------------
		  */
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity
			) 
			SELECT 
				item_inventory.user_id,
				item_inventory.item_id,
				item_inventory.quantity
			FROM item_inventory, users
			WHERE 
				users.user_id = item_inventory.user_id`
			, `run`
			, []
			, `Migrating item_inventory into user_inventories`
		)	

		await this._query(`
			INSERT INTO shop (
				item_id,
				item_price_id,
				price
			)
			SELECT
				itemlist.itemId,
				52,
				itemlist.price
			FROM itemlist, items
			WHERE 
				items.item_id = itemlist.itemId
				AND items.type_id IN (
					SELECT type_id 
					FROM item_types 
					WHERE name != 'Currencies'
				)`
			, `run`
			, []
			, `Registering all items into shop table, except for one with 'Currencies' type`
		)

		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 

			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = cover OR alias = cover || '_cov') AS itemId,
				1,
				1
			FROM userdata t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.cover IS NOT NULL
			AND t1.cover != ''
			AND t1.cover != 'defaultcover1'`
			, `run`
			, []
			, `Migrating userdata's cover into user_inventories`
		)

		await this._query(`
			UPDATE user_inventories
			SET in_use = 1
			WHERE user_id || '_' || item_id IN (
				SELECT 
					userId || '_' || (SELECT item_id FROM items WHERE alias = cover OR alias = cover || '_cov') AS key
				FROM userdata t1

				INNER JOIN user_inventories t2 
					ON t2.user_id = t1.userId 
					AND t2.item_id = (SELECT item_id FROM items WHERE alias = cover OR alias = cover || '_cov')

				WHERE t1.cover IS NOT NULL
				AND t1.cover != ''
				AND t1.cover != 'defaultcover1'
			)`
			, `run`
			, []
			, `Set cover in_use value to 1 based on user-applied cover in userdata`
		)	

		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = interfacemode) AS itemId,
				1,
				1
			FROM userdata t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.interfacemode IS NOT NULL
			AND t1.interfacemode != ''`
			, `run`
			, []
			, `Migrating userdata's interfacemode into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = sticker) AS itemId,
				1,
				1
			FROM userdata t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.sticker IS NOT NULL
			AND t1.sticker != ''`
			, `run`
			, []
			, `Migrating userdata's sticker into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = expbooster) AS itemId,
				1,
				1
			FROM usercheck t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.expbooster IS NOT NULL
			AND t1.expbooster != ''`
			, `run`
			, []
			, `Migrating usercheck's exp boosters into user_inventories`
		)

		/**
		 *  Sub-migrating
		 *  Migrates each badges in userbadges into individual row in user_inventories
		 */
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot1) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot1 IS NOT NULL
			AND t1.slot1 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot1) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot2) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot2 IS NOT NULL
			AND t1.slot2 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot2) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot3) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot3 IS NOT NULL
			AND t1.slot3 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot3) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot4) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot4 IS NOT NULL
			AND t1.slot4 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot4) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot5) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot5 IS NOT NULL
			AND t1.slot5 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot5) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slot6) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slot6 IS NOT NULL
			AND t1.slot6 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot6) into user_inventories`
		)
		await this._query(`
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userId,
				(SELECT item_id FROM items WHERE alias = slotanime) AS itemId,
				1,
				1
			FROM userbadges t1

			LEFT JOIN user_inventories t2 
				ON t2.user_id = t1.userId 
				AND t2.item_id = itemId

			WHERE t2.user_id IS NULL 
			AND t2.item_id IS NULL
			AND t1.slotanime IS NOT NULL
			AND t1.slotanime != ''`
			, `run`
			, []
			, `Migrating userbadges(slotanime) into user_inventories`
		)


		/**
		 * ---------------------------------------------------------
		 * Registering relationships
		 * ---------------------------------------------------------
		 */
		await this._query(`
			INSERT INTO relationships (
				relationship_id,
				name
			)
			SELECT
				typeId,
				type
			FROM relationshiptype`
			, `run`
			, []
			, `Migrating relationshiptype into relationships`
		)
		await this._query(`
			INSERT INTO user_relationships (
				user_id_A,
				user_id_B,
				relationship_id
			)
			SELECT
				userId1,
				userId2,
				relationType2
			FROM relationship
			WHERE relationType2 IS NOT NULL`
			, `run`
			, []
			, `Migrating relationship(A) into user_relationships`
		)
		await this._query(`
			INSERT INTO user_relationships (
				user_id_A,
				user_id_B,
				relationship_id
			)
			SELECT
				userId2,
				userId1,
				relationType1
			FROM relationship
			WHERE relationType1 IS NOT NULL`
			, `run`
			, []
			, `Migrating relationship(B) into user_relationships`
		)

		/**  --------------------------
		  *  USER SOCIAL MEDIAS
		  *  --------------------------
		  */
		await this._query(`
			INSERT INTO user_socialmedias (
				user_id,
				url,
				account_type
			) 
			SELECT 
				userdata.userId,
				userdata.anime_link,
				'MAL/Kitsu'
			FROM userdata, users
			WHERE 
				users.user_id = userdata.userId
				AND userdata.anime_link IS NOT NULL`
			, `run`
			, []
			, `Migrating userdata's anime link into user_socialmedias`
		)

		await this._query(`
			INSERT INTO strikes (
				registered_at,
				user_id,
				guild_id,
				reported_by,
				reason
			) 
			SELECT 
				timestamp,
				userId,
				459892609838481408,
				assigned_by,
				reason
			FROM strike_list`
			, `run`
			, []
			, `Migrating strike_list into strikes`
		)
		await this._query(`
			INSERT INTO commands_log (
				registered_at,
				user_id,
				guild_id,
				command_alias,
				resolved_in
			) 
			SELECT 
				timestamp,
				user_id,
				guild_id,
				command_alias,
				resolved_in
			FROM commands_usage`
			, `run`
			, []
			, `Migrating commands_usage into commands_log`
		)
		await this._query(`
			INSERT INTO resource_log (
				registered_at,
				uptime,
				ping,
				cpu,
				memory
			) 
			SELECT 
				timestamp,
				uptime,
				ping,
				cpu,
				memory
			FROM resource_usage`
			, `run`
			, []
			, `Migrating resource_usage into resource_log`
		)
		
		return true
	}

}

module.exports = Database
