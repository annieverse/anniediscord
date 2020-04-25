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
	 *  @param {boolean} [rowsOnly=false] set this to `true` to remove stmt property from returned result. Optional
	 *  @param {boolean} [ignoreError=false] set this to `true` to keep the method running even when the error occurs. Optional
	 *  @private
	 *  @returns {QueryResult}
	 */
	async _query(stmt=``, type=`get`, supplies=[], label=``, rowsOnly=false, ignoreError=false) {
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
					last_updated_at = datetime('now')
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
	getGuildConfigurations(guildId=``) {
		this._query(`
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
				AVG(uptime) AS 'uptime',
				AVG(ping) AS 'ping',
				AVG(cpu) AS 'cpu',
				AVG(memory) AS 'memory',
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
				INSERT INTO user_socialmedias(user_id, type, url)
				SELECT $userId, $type, $url
				WHERE NOT EXISTS (SELECT 1 FROM user_socialmedia WHERE user_id = $userId AND account_type = $type)`
				, `run`
				, {userId: userId, type: type, url: url}
			),
			//	Try to update available row. It won't crash if no row is found.
			update: await this._query(`
				UPDATE user_socialmedia
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
				last_updated_at = datetime('now', 'localtime'),
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
			SELECT * FROM strike_records
			WHERE user_id = ?`
			, `all`
			, [userId]
			, `Fetching strike_records for USER_ID ${userId}`
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
			INSERT INTO strike_records(
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
	 * Pull user's inventories metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserInventory(userId=``) {
		return this._query(`
			SELECT *
			FROM user_inventories
			INNER JOIN items
			ON items.item_id = user_inventories.item_id
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
			ORDER BY last_updated_at DESC
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
				posted_at,
				last_updated_at,
				user_id,
				url,
				caption,
				channel_id,
				guild_id
			)
			VALUES (
				datetime('now'),
				datetime('now'),
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
			SELECT * 
			FROM items
			WHERE 
				item_id = $keyword
				OR lower(name) = lower($keyword)
				OR lower(alias) = lower($keyword)
			LIMIT 1`
			, `get`
			, {keyword: keyword}	
			, `Looking up for an item with keyword "${keyword}"`
		)
	}

	/**
	 * Fetch purchasable items in the shop.
	 * @param {number} [limit=10] the limit for returned rows
	 * @returns {QueryResult}
	 */
	getPurchasableItems(limit=10) {
		return this._query(`
			SELECT * 
			FROM items
			WHERE 
				available_on_shop = 1,
				type != 'CURRENCY'
			ORDER BY price DESC
			LIMIT ?`
			, `all`
			, [limit]	
			, `Looking up for ${limit} purchasable items`
			, true
		)
	}

	/**
	 * Fetch droppable items from `item_gacha` table.
	 * @returns {QueryResult}
	 */
	getDroppableItems() {
		return this._query(`
			SELECT * 
			FROM item_gacha
			WHERE droppable = 1`
			, `all`
			, []	
			, `Looking up for droppable items`
			, true
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

	updateExpBooster(newvalue) {
		sql.run(`UPDATE usercheck 
            SET expbooster = "${newvalue}",
                expbooster_duration = ${Date.now()}
            WHERE userId = "${this.id}"`)
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

	/** -------------------------------------------------------------------------------
	 *  User Relationship Methods.
	 *  @todo
	 *  * REQUIRE UPDATES @sunnyrainyworks
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Fetch user's relationship info
	 * @param {string} [userId=``] target user id
	 * @returns {QueryResult}
	 */
    getUserRelations(userId=``) {
		return this._query(`
			SELECT 
			r1.type AS "myRelation", r2.type AS "theirRelation",
			userId1 as "myUserId", userId2 AS "theirUserId"
			FROM relationship r
			JOIN relationshiptype r1
			ON r.relationType1 = r1.typeId
			JOIN relationshiptype r2
			ON r.relationType2 = r2.typeId
			WHERE r.userId1 = ? AND relationType1 > 0 AND relationType2 > 0
				
			UNION
			
			SELECT 
			r1.type AS "myRelation", r2.type AS "theirRelation",
			userId2 as "myUserId", userId1 AS "theirUserId"
			FROM relationship r
			JOIN relationshiptype r1
			ON r.relationType2 = r1.typeId
			JOIN relationshiptype r2
			ON r.relationType1 = r2.typeId
			WHERE r.userId2 = ? AND relationType1 > 0 AND relationType2 > 0`
			, `all`
			, [userId, userId]
		)
    }

	/**
	 * Pull available relationship types
	 * @type {QueryResult}
	 */
    get relationshipTypes() {
		return this._query(`
			SELECT * FROM relationshiptype
			ORDER BY typeId ASC`
			, `all`	
		)
    }

	async setRelationship(relType, userId) {
		var res = await sql.all(`SELECT * FROM relationship WHERE userId1 = "${this.id}" AND userId2 = "${userId}"`)

		if (res.length>0) {
			return sql.run(`
                UPDATE relationship
                SET relationType2 = ${relType} 
                WHERE userId1 = "${this.id}" AND userId2 = "${userId}"
            `)
		}
		res = await sql.all(`SELECT * FROM relationship WHERE userId2 = "${this.id}" AND userId1 = "${userId}"`)

		if (res.length>0) {
			return sql.run(`
                UPDATE relationship
                SET relationType1 = ${relType} 
                WHERE userId2 = "${this.id}" AND userId1 = "${userId}"
            `)
		}
		return sql.run(`
                INSERT INTO relationship
                (userId1, userId2, relationType2)
                VALUES (?, ?, ?)`,
			[this.id, userId, relType]//relationStart
		)
	}


	deleteRelationship(userId) {
		return sql.run(`DELETE FROM relationship
						WHERE (userId1 = "${this.id}" AND userId2 = "${userId}")
						OR (userId2 = "${this.id}" AND userId1 = "${userId}")`)
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
		await this.client.exec(`
			BEGIN;
			DROP TABLE IF EXISTS users;
			DROP TABLE IF EXISTS user_dailies;
			DROP TABLE IF EXISTS user_reputations;
			DROP TABLE IF EXISTS user_exp;
			DROP TABLE IF EXISTS user_posts;
			DROP TABLE IF EXISTS user_inventories;
			DROP TABLE IF EXISTS user_socialmedias;
			DROP TABLE IF EXISTS items;
			DROP TABLE IF EXISTS strikes;
			DROP TABLE IF EXISTS commands_log;
			DROP TABLE IF EXISTS resource_log;
			COMMIT;
			`)
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
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_login_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'name' TEXT,
		   'bio' TEXT DEFAULT "Hi! I'm new user!",
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
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'user_id' TEXT PRIMARY KEY,
		   'current_exp' INTEGER DEFAULT 0,
		   'booster_id' INTEGER DEFAULT 0,
		   'booster_activated_at' TIMESTAMP,

		   FOREIGN KEY(user_id) 
		   REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table user_exp`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS user_inventories (
		   
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT,
			'item_id' INTEGER,
			'quantity' INTEGER DEFAULT 0,
			'in_use' INTEGER DEFAULT 0,

			PRIMARY KEY (user_id, item_id),
			FOREIGN KEY(user_id) 
			REFERENCES users(user_id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE

			)`
			, `run`
			, []
			, `Verifying table user_inventories`
		)

	   await this._query(`CREATE TABLE IF NOT EXISTS user_posts (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'post_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'user_id' TEXT,
		   'url' TEXT,
		   'caption' TEXT,
		   'channel_id' TEXT,
		   'guild_id' TEXT,
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
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
			'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'config_id' INTEGER PRIMARY KEY AUTOINCREMENT,
			'guild_id' TEXT,
			'channel_id' TEXT,
			'config_name' TEXT,
			'set_by' TEXT,

			FOREIGN KEY(guild_id)
			REFERENCES guilds(guild_id)
				ON DELETE CASCADE
				ON UPDATE CASCADE

			)`
			, `run`
			, []
			, `Verifying table guild_configurations`
		)	

	   /**
		* --------------------------
		* ITEMS TREES
		* --------------------------
		*/
	   await this._query(`CREATE TABLE IF NOT EXISTS items (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'item_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'name' TEXT,
		   'alias' TEXT,
		   'rarity' INTEGER,
		   'type' TEXT,
		   'price' INTEGER,
		   'description' TEXT,
		   'max_stacks' INTEGER DEFAULT 9999,
		   'bind' TEXT DEFAULT 0,
		   'available_on_shop' INTEGER DEFAULT 1

		   )`
		   , `run`
		   , []
		   , `Verifying table items`
	   )

	   await this._query(`CREATE TABLE IF NOT EXISTS item_gacha (

		   'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'last_updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		   'gacha_id' INTEGER PRIMARY KEY AUTOINCREMENT,
		   'item_id' INTEGER,
		   'quantity' INTEGER DEFAULT 1,
		   'drop_rate' REAL,
		   'droppable' INTEGER DEFAULT 1,

			FOREIGN KEY(item_id)
			REFERENCES items(item_id)
				ON DELETE CASCADE
				ON UPDATE CASCADE

		   )`
		   , `run`
		   , []
		   , `Verifying table item_gacha`
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

		//  Updating item db
		await this._query(`
			INSERT OR IGNORE INTO items (
				item_id,
				name,
				alias,
				rarity,
				type,
				price,
				description
			) 
			SELECT 
				itemId,
				name,
				alias,
				rarity,
				upper(type),
				price,
				desc
			FROM itemlist`
			, `run`
			, []
			, `Migrating itemlist into items`
		)	
		await this._query(`
			UPDATE items 
			SET 
				name = 'Light Profile Theme',
				description = 'Delightful. Pure. Clean slate color for your profile card.',
				type = 'THEMES'
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
				type = 'THEMES'
			WHERE alias = 'dark'`
			, `run`
			, []
			, `Updating [Dark Profile Theme] in items table`
		)
		await this._query(`
			UPDATE items 
			SET max_stacks = 1
			WHERE type in (
				'COVERS',
				'BADGES',
				'THEMES',
				'STICKERS'
			)`
			, `run`
			, []
			, `Updating decoration item's max_stacks to 1 in items table`
		)
		await this._query(`
			UPDATE items 
			SET max_stacks = 99999999999999
			WHERE alias = 'artcoins'`
			, `run`
			, []
			, `Updating artcoins max_stacks to 99999999999999 in items table`
		)			
		await this._query(`
			UPDATE items 
			SET alias = 'lalolu_cov' 
			WHERE name = 'Lalolu' AND type = 'Covers'`
			, `run`
			, []
			, `Fixing Lalolu's Cover alias`
		)	
		await this._query(`
			UPDATE items 
			SET type = 'CARDS'
			WHERE type = 'CARD'`
			, `run`
			, []
			, `Updating items with CARD type into CARDS (plural) in items table`
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
			INSERT OR IGNORE INTO users (
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
			INSERT OR IGNORE INTO user_dailies (
				last_updated_at,
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
			INSERT OR IGNORE INTO user_reputations (
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
			INSERT OR IGNORE INTO user_exp (
				user_id,
				current_exp,
				booster_id,
				booster_activated_at
			) 
			SELECT 
				usercheck.userId user_id,
				userdata.currentexp current_exp,
				(SELECT itemId FROM itemlist WHERE alias = usercheck.expbooster),
				usercheck.expbooster_duration
			FROM usercheck, userdata
			WHERE usercheck.userId = userdata.userId`
			, `run`
			, []
			, `Migrating userdata and usercheck exp data into user_exp`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_posts (
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
		  *  USER INVENTORIES
		  *  --------------------------
		  */
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
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
			INSERT INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				users.user_id,
				items.item_id,
				1,
				1
			FROM userdata, users, items
			WHERE 
				users.user_id = userdata.userId
				AND items.alias = userdata.cover
				AND userdata.cover != ''
				AND userdata.cover IS NOT NULL
				AND NOT EXISTS (
					SELECT 1
					FROM user_inventories
					WHERE 
						item_id = items.item_id
						AND user_id = users.user_id
				)
			`
			, `run`
			, []
			, `Migrating userdata's cover into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				users.user_id,
				items.item_id,
				1,
				1
			FROM userdata, users, items
			WHERE 
				users.user_id = userdata.userId
				AND items.alias = userdata.interfacemode
				AND userdata.interfacemode != ''
				AND userdata.interfacemode IS NOT NULL 
			`
			, `run`
			, []
			, `Migrating userdata's interfacemode into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				users.user_id,
				items.item_id,
				1,
				1
			FROM userdata, users, items
			WHERE 
				users.user_id = userdata.userId
				AND items.alias = userdata.sticker
				AND userdata.sticker != ''
				AND userdata.sticker IS NOT NULL 
			`
			, `run`
			, []
			, `Migrating userdata's sticker into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				users.user_id,
				items.item_id,
				1,
				1
			FROM usercheck, users, items
			WHERE 
				users.user_id = usercheck.userId
				AND items.alias = usercheck.expbooster
				AND usercheck.expbooster != ''
				AND usercheck.expbooster IS NOT NULL 
			`
			, `run`
			, []
			, `Migrating usercheck's exp boosters into user_inventories`
		)

		/**
		 *  Sub-migrating
		 *  Migrates each badges in userbadges into individual row in user_decorations
		 */
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot1 IS NOT NULL
				AND items.alias = userbadges.slot1
				AND users.user_id = userbadges.userId
				AND userbadges.slot1 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot1) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot2 IS NOT NULL
				AND items.alias = userbadges.slot2
				AND users.user_id = userbadges.userId
				AND userbadges.slot2 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot2) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot3 IS NOT NULL
				AND items.alias = userbadges.slot3
				AND users.user_id = userbadges.userId
				AND userbadges.slot3 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot3) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot4 IS NOT NULL
				AND items.alias = userbadges.slot4
				AND users.user_id = userbadges.userId
				AND userbadges.slot4 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot4) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot5 IS NOT NULL
				AND items.alias = userbadges.slot5
				AND users.user_id = userbadges.userId
				AND userbadges.slot5 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot5) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slot6 IS NOT NULL
				AND items.alias = userbadges.slot6
				AND users.user_id = userbadges.userId
				AND userbadges.slot6 != ''`
			, `run`
			, []
			, `Migrating userbadges(slot6) into user_inventories`
		)
		await this._query(`
			INSERT OR IGNORE INTO user_inventories (
				user_id,
				item_id,
				quantity,
				in_use
			) 
			SELECT 
				userbadges.userId,
				items.item_id,
				1,
				1
			FROM userbadges, users, items
			WHERE 
				userbadges.slotanime IS NOT NULL
				AND items.alias = userbadges.slotanime
				AND users.user_id = userbadges.userId
				AND userbadges.slotanime != ''`
			, `run`
			, []
			, `Migrating userbadges(slotanime) into user_inventories`
		)


		/**  --------------------------
		  *  USER SOCIAL MEDIAS
		  *  --------------------------
		  */
		await this._query(`
			INSERT OR IGNORE INTO user_socialmedias (
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
			INSERT OR IGNORE INTO strikes (
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
			INSERT OR IGNORE INTO commands_log (
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
			INSERT OR IGNORE INTO resource_log (
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
