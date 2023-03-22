const SqliteClient = require(`better-sqlite3`)
const Redis = require(`async-redis`)
const logger = require(`pino`)({name: `DATABASE`, level: `debug`})
const getBenchmark = require(`../utils/getBenchmark`)
const fs = require(`fs`)
const { join } = require(`path`)

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
	 * @param {Client} client sql instance that is going to be used
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
		fs.accessSync(join(__dirname, fsPath), fs.constants.F_OK)
		this.client = new SqliteClient(path, { timeout:10000 })
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
	async isCacheExist(key=``) {
		const cache = await this.redis.get(key)
		return cache !== null ? true : false
	}

	/**
	 * Retrieve cache.
	 * @param {string} [key=``] Target cache's key.
	 * @return {string|null}
	 */
	getCache(key=``) {
		return this.redis.get(key)
	}

	/**
	 * Register cache.
	 * @param {string} [key=``] Target cache's key.
	 * @param {string} [value=``] The content to be filled in.
	 * @return {boolean}
	 */
	setCache(key=``, value=``) {
		return this.redis.set(key, value)
	}

	/**
	 * Clearing out cache.
	 * @param {string} [key=``] Target cache's key.
	 * @return {boolean}
	 */
	clearCache(key=``) {
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
	async _query(stmt=``, type=`get`, supplies=[]) {
		//	Return if no statement has found
		if (!stmt) return null
        const que = this.client.prepare(stmt)
        const fn = this.client.transaction(params => que[type](params))
        const result = await fn(supplies) 
        if (!result) return null
        return result
	}

    /**
     * Migrate lucky ticket's metadata into Annie's Pandora Box.
     * @return {QueryResult}
     */
    migrateLuckyTicketMetadata() {
        return this._query(`
            UPDATE items
            SET
                name = 'Annie Pandora Box',
                description = 'Mysterious box filled with strange powah'
            WHERE item_id = 71`
            , `run`
        )
    }

	/**
	 * Standardized method for making changes to the user_inventories
	 * @param {itemsMetadata} meta item's metadata
	 * @returns {boolean}
	 */
	async updateInventory({itemId, value=0, operation=`+`, distributeMultiAccounts=false, userId, guildId}) {
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
                    AND EXISTS (SELECT 1 FROM users WHERE user_id = $userId)`
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
					, {itemId: itemId, userId: userId, guildId: guildId}
				),
				//	Try to update available row. It won't crash if no row is found.
				update: await this._query(`
					UPDATE user_inventories
					SET 
						quantity = quantity ${operation} ?,
						updated_at = datetime('now')
					WHERE item_id = ? AND user_id = ? AND guild_id = ?`
					, `run`
					, [value, itemId, userId, guildId]
				)
			}
		}
		
		const type = res.update.changes ? `UPDATE` : res.insert.changes ? `INSERT` : `NO_CHANGES`
		logger.info(`${fn} ${type}(${distributeMultiAccounts ? `distributeMultiAccounts` : ``})(${operation}) (ITEM_ID:${itemId})(QTY:${value}) | USER_ID ${userId}`)
		return true
	}

	/**
	 * Set user item's `in_use`` value to `1`
	 * @param {number} [itemId] target item's id.
	 * @param {string} [userId=``] User's discord id.
	 * @param {string} [guildId=``] target guild where user's inventory is stored.
	 * @returns {QueryResult}
	 */
	useItem(itemId, userId=``, guildId=``) {
		const fn = `[Database.useItem()]`
		if (!itemId) throw new TypeError(`${fn} parameter "itemId" cannot be blank.`)
		if (!userId) throw new TypeError(`${fn} parameter "userId" cannot be blank.`)
		if (!guildId) throw new TypeError(`${fn} parameter "guildId" cannot be blank.`)		
		return this._query(`
			UPDATE user_inventories
			SET in_use = 1
			WHERE 
				user_id = ?
				AND item_id = ?
				AND guild_id = ?`
			, `run`
			, [userId, itemId, guildId]
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
	 * Fetch registered user's reminders
	 * @param {string} userId
	 * @return {array}
	 */
	getUserReminders(userId=``) {
		return this._query(`
			SELECT * 
			FROM user_reminders
			WHERE user_id = ?`
			, `all`
			, [userId]	
		)
	}

	/**
	 * Fetch all registered user's reminders
	 * @return {array}
	 */
	getAllReminders() {
		return this._query(`
			SELECT * 
			FROM user_reminders`
			, `all`	
		)
	}

	/**
	 * Registering a new reminder
	 * @param {object}
	 * @return {QueryResult}
	 */
	registerUserReminder(context={}) {
		return this._query(`
			INSERT INTO user_reminders(
				registered_at,
				reminder_id,
				user_id,
				message,
				remind_at
			)
			VALUES(?, ?, ?, ?, ?)`
			, `run`
			, [
				context.registeredAt.toString(),
				context.id,
				context.userId, 
				context.message, 
				JSON.stringify(context.remindAt)
			]
		)
	}

	/**
	 * Deleting reminder from database
	 * @return {QueryResult}
	 */
	deleteUserReminder(reminderId=``) {
		return this._query(`
			DELETE FROM user_reminders
			WHERE reminder_id = ?`
			, `run`
			, [reminderId]
		)
	}

	/**
	 * Create user_reminder master table
	 * @return {QueryResult}
	 */
	registerUserRemindersMasterTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS user_reminders (

			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'reminder_id' TEXT PRIMARY KEY,
			'user_id' TEXT,
			'message' TEXT,
			'remind_at' TEXT,
 
			FOREIGN KEY(user_id)
			REFERENCES users(user_id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE
 
			)`
			, `run`
			, []
			, `Verifying table user_reminders`
		)
	}
	
	/**
	 * Custom Rewards
	 */

	registerCustomRewardTable(){
		return this._query(`CREATE TABLE IF NOT EXISTS custom_rewards (
			'registered_at'	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			'reward_id'	INTEGER NOT NULL UNIQUE,
			'guild_id'	TEXT NOT NULL,
			'set_by_user_id'	TEXT NOT NULL,
			'reward'	TEXT NOT NULL,
			'reward_name'	TEXT NOT NULL,
			PRIMARY KEY("reward_id" AUTOINCREMENT)
		)`
		, `run`
		, []
		, `Verifying table custom_rewards`)
	}
	
	recordReward(guildId, userId, rewardBlob, rewardName){
		return this._query(` INSERT INTO custom_rewards (registered_at, guild_id, set_by_user_id, reward, reward_name)
		VALUES (datetime('now'), $guild_id, $user_id, $reward, $rewardName)`
		, `run`
		, {guild_id:guildId, user_id:userId, reward:rewardBlob, rewardName:rewardName}
		)
	}

	deleteReward(guildId, rewardName){
		return this._query(` DELETE FROM custom_rewards WHERE guild_id = $guild_id AND reward_name = $rewardName`
		, `run`
		, {guild_id:guildId, rewardName:rewardName}
		)
	}

	getRewardByName(guildId, rewardName){
		return this._query(`SELECT reward FROM custom_rewards WHERE guild_id = $guild_id AND reward_name = $reward_name`
		, `all`
		, {guild_id:guildId, reward_name:rewardName}
		)
	}

	getRewardById(guildId, reward_id){
		return this._query(`SELECT reward FROM custom_rewards WHERE guild_id = $guild_id AND reward_id = $reward_id`
		, `all`
		, {guild_id:guildId, reward_id:reward_id}
		)
	}

	getRewardAmount(guildId){
		return this._query(`SELECT * FROM custom_rewards WHERE guild_id = $guild_id`
		, `all`
		, {guild_id:guildId}
		)
	}
	/**
	 *  --------------------------------
	 *  #GUILD AUTORESPONDER MANAGEMENT
	 *  --------------------------------
	 */

	/**
	 * Create autoresponders master table.
	 * @return {QueryResult}
	 */
	registerAutoResponderMasterTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS autoresponders (

			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'ar_id' INTEGER PRIMARY KEY AUTOINCREMENT,
			'guild_id' TEXT,
			'user_id' TEXT,
			'trigger' TEXT,
			'response' TEXT
 
			)`
			, `run`
			, []
			, `Verifying table autoresponders`
		)
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
	 * @typedef {object} AutoresponderMetadata
	 * @property {string} [guildId=``] Target guild.
	 * @property {string} [userId=``] Set by user.
	 * @property {string} [trigger=``] Trigger to specific message.
	 * @property {string} [response=``] The response from trigger.
	 */

	/**
	 * Registering new autoresponder to specific guild.
	 * @param {AutoresponderMetadata} [meta={}] The AR metadata to be registered.
	 * @return {QueryResult}
	 */
	async registerAutoResponder({guildId=``, userId=``, trigger=``, response=``}) {
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
	async deleteAutoResponder(id, guildId=``) {
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
	clearAutoResponders(guildId=``) {
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

	/**
	 * Retrieving all the registered ARs from specific guild.
	 * @param {string} [guildId=``] Target guild.
	 * @param {boolean} [fetchCache=true] Toggle false to make it always fetching from database.
	 * @return {QueryResult}
	 */
	async getAutoResponders(guildId=``, fetchCache=true) {
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
	 *  --------------------------------
	 *  #USER COVER MANAGEMENT
	 *  --------------------------------
	 */

	/**
	 * Initializing user_self_covers table
	 * @return {QueryResult}
	 */
	initializeUserSelfCoverTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS user_self_covers (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'cover_id' TEXT,
			'user_id' TEXT,
			'guild_id' TEXT,
			PRIMARY KEY(user_id, guild_id),
		    FOREIGN KEY(user_id)
		    REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE)`
		   	, `run`
		   	, []
		   	, `Verifying quests user_self_covers`
		)
	}

	/**
	 * Return user's cover data on specific guild
	 * @param {string} userId
	 & @param {string} guildId
	 * @return {QueryResult}
	 */
	async getUserCover(userId=``, guildId=``) {
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
	 * Deleting self-upload cover
	 * @param {string} userId
	 * @param {string} guildId
	 * @return {QueryResult}
	 */
	deleteSelfUploadCover(userId=``, guildId=``) {
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
	async applySelfUploadCover(coverId, userId=``, guildId=``) {
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
				, {coverId: coverId, userId: userId, guildId: guildId}
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
	 * Applying new cover to user's profile.
	 * @param {number} [coverId] target cover to be applied.
	 * @param {string} [userId=``] target user's id.
	 * @param {string} [guidId=``] target guild
	 * @returns {QueryResult}
	 */
	async applyCover(coverId, userId=``, guildId=``) {
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

	/**
	 * Detach user's covers. Aftewards, combined with `this.useItem()`
	 * @param {string} [userId=``] target user's id.
	 * @param {string} [guidId=``] target guild
	 * @returns {QueryResult}
	 */
	async detachCovers(userId=``, guildId=``) {
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
	
	/** -------------------------------------------------------------------------------
	 *  Guild Methods
	 *  -------------------------------------------------------------------------------
	 */

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

	/**
	 * Retrieve the existing guild's bio
	 * @param {String} guild guild id
	 * @returns {String}
	 */
	getExistingGuildBio(guild){
		return this._query(`SELECT bio FROM guilds WHERE guild_id = ?`,`get`, [guild])
	}


	/**
	 * Set a new bio for the guild
	 * @param {string} [guildId=``] Target guild id
	 * @param {string} [bio=``] The new bio to be set 
	 */
	setGuildBio(guildId=``, bio=``){
		const fn = `[Database.setGuildBio()]`
		return this._query(`
			UPDATE guilds 
			SET bio = ?, updated_at = CURRENT_TIMESTAMP 
			WHERE guild_id = ?`
			, `run`
			, [bio, guildId]
			, `${fn} updating new bio for GUILD_ID ${guildId}`
		)
	}

	/**
	 * Registering guild to the list of guilds 
	 * @param {object} [guild={}] to be registered from.
	 * @returns {QueryResult}
	 */
	registerGuild(guild={}) {
		return this._query(`
			INSERT INTO guilds (guild_id, name)
			SELECT $guildId, $guildName
			WHERE NOT EXISTS (SELECT 1 FROM guilds WHERE guild_id = $guildId)`
			, `run`
			, {guildId:guild.id, guildName:guild.name}
		)
	}

	/**
	 * Insert or update an existing config values
	 * @param {Object} {object} {config_code, guild_id, customized_parameter, set_by_user_id}
	 * @returns {QueryResult}
	 */
	async setCustomConfig({config_code, guild, customized_parameter, set_by_user_id}){
		this._query(`INSERT OR IGNORE INTO guilds (guild_id, name, bio) values (?, ?, 'I am an awsome server come join me')`
			, `run`
			, [guild.id, guild.name])

		this._query(`UPDATE guilds SET updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`
			,`run`
			, [guild.id])
		let config_id
		try {
			config_id = await this._query(`SELECT config_id FROM guild_configurations WHERE config_code = ? AND guild_id = ?`, `get`,[config_code, guild.id])
			config_id = config_id.config_id
			this._query(`INSERT OR IGNORE INTO guild_configurations (config_id, config_code, guild_id) values (?, ?, ?)`
			, `run`
			, [config_id, config_code, guild.id])
		} catch (error) {
			this._query(`INSERT OR IGNORE INTO guild_configurations (config_code, guild_id) values (?, ?)`
			, `run`
			, [config_code, guild.id])
		}
		return this._query(`UPDATE guild_configurations SET updated_at = CURRENT_TIMESTAMP, customized_parameter = ?, set_by_user_id = ? 
			WHERE guild_id = ? AND config_code = ?`
			, `run`
			, [customized_parameter, set_by_user_id,  guild.id, config_code])
	}


	/**
	 * Options to be supplied to `this.updateGuildConfiguration()` parameters
	 * @typedef {object} guildConfigurations
	 * @property {string} [configCode=null] type of the configuration to be stored. Must be uppercased.
	 * @property {object} [guild+=null] Target guild_id to be stored.
	 * @property {string} [setByUserId=null] Identifier for the registrar.
	 * @property {map} [cacheTo=null] Target cache object to be stored into. If value is not provided, then result won't be cached.
	 */

	/**
	 * Insert or update an existing guild config values
	 * @param {guildConfigurations} obj
	 * @returns {QueryResult}
	 */
	async updateGuildConfiguration({configCode=null, guild=null, customizedParameter=null, setByUserId=null, cacheTo={}}) {
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
	 * Delete a guild's config from guild_configurations table
	 * @param {string} [configCode=``] the identifier code for a configuration/module
	 * @parma {string} [guildId=``] target guild 
	 * @returns {boolean}
	 */
	async deleteGuildConfiguration(configCode=``, guildId=``) {
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

	async getNitroColorChange(){
		let nitro_role_color_changer = await this._query(`SELECT * FROM guild_configurations WHERE config_code = 'nitro_role_color_changer' AND customized_parameter = 'true'`,`all`)
		let nitro_role = await this._query(`SELECT * FROM guild_configurations WHERE config_code = 'nitro_role'`,`all`)
		let allowed = [], newObj = {}
		for (let i = 0; i < nitro_role_color_changer.length; i++) {
			const elementOne = nitro_role_color_changer[i]
			for (let j = 0; j < nitro_role.length; j++) {
				const elementTwo = nitro_role[j]
				newObj.guild_id = elementOne.guild_id
				newObj.nitro_role = elementTwo.customized_parameter
				if (elementOne.guild_id == elementTwo.guild_id) allowed.push(newObj)
				newObj = {}
			}
		}
		return allowed
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
		this.redis.set(key, JSON.stringify(res), `EX`, (60*60)*12)
        return res
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
	

	/** -------------------------------------------------------------------------------
	 *  User's manager methods
	 *  -------------------------------------------------------------------------------
	 */	
	

	doesUserRegisteredInTheGuild(userId=``, guildId=``) {
		return this._query(`
			SELECT COUNT(*) AS is_registered
			FROM user_exp
			WHERE 
				user_id = ?
				AND guild_id = ?`
			, `get`
			, [userId, guildId]
		)
	}

	/**
	 * Register a user into user-tree tables if doesn't exist.
	 * @param {string} [userId=``] User's discord id.
	 * @param {string} [userName=``] User's username. Purposely used when fail to fetch user by id.
	 * @returns {void}
	 */
	async validateUserEntry(userId=``, userName=``) {
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
            , {userId: userId, userName: userName}
        )
        if (res.changes) logger.info(`USER_ID:${userId} registered`) 
        this.redis.sadd(key, userId)
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

    /** -------------------------------------------------------------------------------
	 *  User's Reputations Method
	 *  -------------------------------------------------------------------------------
	 */	
    
    /**
	 * Pull user's reputations metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserReputation(userId=``, guildId=``) {
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_reputations
            WHERE user_id = ?
            AND guild_id = ?`
            , `get`
            , [userId, guildId]
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
	async updateUserReputation(amount=0, userId=``, givenBy=null, guildId=``, operation=`+`) {
        const res = {
            update: await this._query(`
                UPDATE user_reputations 
                SET 
                    total_reps = total_reps + ?,
                    last_received_at = datetime('now'),
                    recently_received_by = ?
                WHERE user_id = ? AND guild_id = ?`
                , `run`
                , [amount, givenBy, userId, guildId]
            ),
            insert: await this._query(`
                INSERT INTO user_reputations(last_giving_at, user_id, guild_id, total_reps)
                SELECT datetime('now','-1 day'), $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_reputations WHERE user_id = $userId AND guild_id = $guildId)`
                , `run`
                , {userId:userId, guildId:guildId, amount:amount}
            )
        }
		//  Refresh cache 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_REPS][${type}](${operation}) (REPS:${amount} | EXP_ID:${userId}@${guildId}`)
	}

	/**
	 * Updating the timestamp for reputation giver.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	updateReputationGiver(userId=``, guildId=``) {
		return this._query(`
			UPDATE user_reputations 
			SET last_giving_at = datetime('now')
			WHERE user_id = ? 
            AND guild_id = ?`
			, `run`
			, [userId, guildId]
		)
	}

    /** -------------------------------------------------------------------------------
	 *  User's Dailies Method
	 *  -------------------------------------------------------------------------------
	 */	

    /**
	 * Pull user's dailies metadata. Will use cache in available.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserDailies(userId=``, guildId =``) {
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
	async updateUserDailies(streak=0, userId=``, guildId=``) {
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
                , {userId:userId, guildId:guildId}
            )
        }
        //  Refresh cache
		this.redis.del(`DAILIES_${userId}@${guildId}`) 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_DAILIES][${type}] (STREAK:${streak} | DAILIES_ID:${userId}@${guildId}`)
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

	/**
	 * Get current timestamp in SQlite format
	 * @returns {string}
	 */
	async getCurrentTimestamp() {
		const res = await this._query(`SELECT CURRENT_TIMESTAMP`)
		return res.CURRENT_TIMESTAMP
	}

	/**
	 * Trading System Plugin
	 */
	/**
	 * sets the block status to true for a trade user
	 * @param {string} user_id 
	 * @param {string} reason 
	 *//*
	blockUser(user_id, reason = `The Moderator didn't supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.`){
		this._query(`
			UPDATE modmail_blocked_users 
			SET blocked = 1 AND reason = ?
			WHERE user_id = ?`
			, `run`
			, [user_id, reason]
			, `blocking user table: modmail_blocked_users`
			)
	}*/
	/**
	 * End of Trading System Plugin 
	 */

	/**
	 * MODMAIL Plugin
	 */
	/**
	 * Records message to corresponding thread id
	 * @param {string} user_id 
	 * @param {string} mod_id 
	 * @param {string} guild_id 
	 * @param {string} thread_id 
	 * @param {string} text 
	 */
    writeToThread(user_id, mod_id, guild_id, thread_id, text){
        this._query(`
			INSERT INTO modmail_thread_messages (registered_at, user_id, mod_id, guild_id, thread_id, message)
			VALUES (datetime('now'), ?, ?, ?, ?, ?)`
			, `run`
			, [user_id, mod_id, guild_id, thread_id, text]
			)
	}
	/**
	 * Retrieves all blocked users
	 * @returns {QueryResult}
	 */
	getBlockedUsers(){
		return this._query(`
				SELECT user_id
				FROM modmail_blocked_users
				WHERE blocked = 1`
				, `all`
				, []
				,`getting blocked users`
			)
	}

	/**
	 * retireves the reason a user was blocked from continuing a thread
	 * @param {string} user_id 
	 */
	getBlockedUserReason(user_id){
		return this._query(`
				SELECT reason
				FROM modmail_blocked_users
				WHERE user_id = ?`
				, `get`
				, [user_id]
				,`getting blocked user's reason`
			)
	}

	/**
	 * retrieves all users on blocked list
	 * @returns {QueryResult}
	 */
	getBlockedUsersList(){
		return this._query(`
			SELECT user_id
			FROM modmail_blocked_users`
			, `all`
			, []
			,`getting blocked users`
		)
	}

	/**
	 * creates a record for the user in blocked users
	 * @param {string} user_id 
	 */
	registerUserInBlockList(user_id){
		this._query(`
			INSERT INTO modmail_blocked_users (registered_at, user_id, blocked)
			VALUES (datetime('now'), ?, 0)`
			, `run`
			, [user_id]
			)
	}

	/**
	 * sets the block status to true for a user
	 * @param {string} user_id 
	 * @param {string} reason 
	 */
	blockUser(user_id, reason = `The Moderator didn't supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.`){
		this._query(`
			UPDATE modmail_blocked_users 
			SET blocked = 1 AND reason = ?
			WHERE user_id = ?`
			, `run`
			, [user_id, reason]
			, `blocking user`
			)
	}

	/**
	 * sets the block status to false for a user
	 * @param {string} user_id 
	 */
	unblockUser(user_id){
		this._query(`
			UPDATE modmail_blocked_users 
			SET blocked = 0
			WHERE user_id = ?`
			, `run`
			, [user_id]
			)
	}

	/**
	 * checks if a user is currently blocked for modmail thread
	 * @param {string} id 
	 */
	isblockedUser(id){
		this._query(`
				SELECT *
				FROM modmail_blocked_users
				WHERE user_id = ?
				AND blocked = 0`
				, `get`
				, [id]
				,`checking if user is blocked`
			)
	}

	/**
	 * searches for an already open thread to continue.
	 * @param {string} id 
	 * @param {boolean} dm 
	 * @returns {QueryResult}
	 */
	async alreadyOpenThread(id, dm = true){
		let search
		if (dm) {
			search = await this._query(`
				SELECT *
				FROM modmail_threads
				WHERE user_id = ?
				AND status = 'open'
				ORDER BY thread_id`
				, `get`
				, [id]
				,`getting open thread`
			)
		} else if (!dm) {
			search = await this._query(`
				SELECT *
				FROM modmail_threads
				WHERE channel = ?
				AND status = 'open'
				ORDER BY thread_id`
				, `get`
				, [id]
				,`getting open thread`
			)
		}
		if (!search) search = `none`
		return search
	}

	/**
	 * Update modmail thread channel for a thread
	 * @param {string} id 
	 * @param {string} threadId 
	 */
	updateChannel(id, threadId){
		this._query(`
				UPDATE modmail_threads
				SET channel = ?
				WHERE thread_id = ?`
				, `run`
				, [id, threadId]
			)
	}

	/**
	 * retrieve all logs associated with a user
	 * @param {string} userId 
	 * @returns {QueryResult}
	 */
	getlogsForUser(userId){
		return this._query(`
			SELECT *
			FROM modmail_threads
			WHERE user_id = ?
			AND status = 'closed' AND is_anonymous = 0
			ORDER BY thread_id`
			, `all`
			, [userId]
			,`getting logs for user`
		)
	}

	/**
	 * Closes a thread based on the thread id
	 * @param {string} thread_id 
	 */
	closeThread(thread_id){
		this._query(`
		UPDATE modmail_threads SET status = 'closed'
		WHERE thread_id = ?`
		, `run`
		, [thread_id]
		)
	}

	/**
	 * Makes a new modmail thread if it doesent exist
	 * @param {string} user_id 
	 * @param {string} guild_id 
	 * @param {string} thread_id 
	 * @param {string} status 
	 * @param {boolean} is_anonymous 
	 */
	makeNewThread(user_id, guild_id, thread_id, status, is_anonymous){
		try {
			this._query(`
			INSERT INTO modmail_threads (registered_at, user_id, guild_id, thread_id, status, is_anonymous)
			VALUES (datetime('now'), ?, ?, ?, ?, ?)`
			, `run`
			, [user_id, guild_id, thread_id, status, is_anonymous]
			)
		} catch (error) {
			thread_id = makeRandomId()
			this.makeNewThread(user_id, guild_id, thread_id, status, is_anonymous)
		}
		
		/**
		 * @returns {string} random string
		 */
		function makeRandomId(){
			var result = ``
			var characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`
			var charactersLength = characters.length
			for ( var i = 0; i < 20; i++ ) {
				result += characters.charAt(Math.floor(Math.random() * charactersLength))
			}
			return result
		}
	}

	/**
	 * deletes a thread based on thread id
	 * @param {string} id 
	 */
	deleteLog(id) {
		this._query(`
			DELETE FROM modmail_thread_messages
			WHERE thread_id = ?`
			, `run`
			, [id]
			,`delete logs for specific thread`
		)
		this._query(`
			DELETE FROM modmail_threads
			WHERE thread_id = ?`
			, `run`
			, [id]
			,`delete logs for specific thread`
		)
	}

	/**
	 * retrieves thread based on thread id
	 * @param {string} id 
	 * @returns {QueryResult}
	 */
	getLogByThreadId(id){
		return this._query(`
			SELECT *
			FROM modmail_thread_messages
			WHERE thread_id = ?`
			, `all`
			, [id]
			,`getting logs for specific thread`
		)
	}
	
	/**
	 * Retrieves all information on a thread by id
	 * @param {string} id 
	 * @returns {QueryResult}
	 */
	getThreadTicket(id){
		return this._query(`
			SELECT *
			FROM modmail_threads
			WHERE thread_id = ?`
			, `get`
			, [id]
			,`getting thread data for specific thread`
		)
	}

	/** -------------------------------------------------------------------------------
	 *  User's Experience Points Method
	 *  -------------------------------------------------------------------------------
	 */	

	/**
	 * Pull user's experience points metadata.
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild.
	 * @returns {QueryResult}
	 */
	async getUserExp(userId=``, guildId=``) {
		const key = `EXP_${userId}@${guildId}`
		//  Retrieve from cache if available
		const cache = await this.redis.get(key)
		if (cache) return JSON.parse(cache)
		//  Otherwise fetch from db and store it to cache for later use.
		const query = () => this._query(`
            SELECT *
            FROM user_exp
            WHERE user_id = ?
            AND guild_id = ?`
            , `get`
            , [userId, guildId]
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
	 * Updating user's experience points.
	 * @param {number} [amount=0] Amount to be added.
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild id.
     * @param {string} [operation=`+`] Set as `-` to do exp substraction.
	 * @returns {QueryResult}
	 */
	async updateUserExp(amount=0, userId=``, guildId=``, operation=`+`) {
        const res = {
            update: await this._query(`
                UPDATE user_exp 
                SET current_exp = current_exp ${operation} ?
                WHERE 
                    user_id = ?
                    AND guild_id = ?`
                , `run`
                , [amount, userId, guildId]
            ),
            insert: await this._query(`
                INSERT INTO user_exp(user_id, guild_id, current_exp)
                SELECT $userId, $guildId, $amount
                WHERE NOT EXISTS (SELECT 1 FROM user_exp WHERE user_id = $userId AND guild_id = $guildId)`
                , `run`
                , {userId:userId, guildId:guildId, amount:amount}
            )
        }
		//  Refresh cache 
		this.redis.del(`EXP_${userId}@${guildId}`) 
		const type = res.insert.changes ? `INSERT` : res.update.changes ? `UPDATE` : `NO_CHANGES`
		logger.info(`[UPDATE_USER_EXP][${type}](${operation}) (EXP:${amount} | EXP_ID:${userId}@${guildId}`)
	}

	/**
	 * Reset user's exp to zero. 
	 * @param {string} [userId=``] Target user's discord id.
	 * @param {string} [guildId=``] Target guild id.
	 * @return {void}
	 */
	resetUserExp(userId=``, guildId=``) {
		const fn = `[Database.resetUserExp]`
		const key = `EXP_${userId}@${guildId}`
		//  Update on database.
		const dbTime = process.hrtime()
		this._query(`
			UPDATE user_exp 
			SET current_exp = 0 
			WHERE 
				user_id = ?
				AND guild_id = ?`
			, `run`
			, [userId, guildId]
		).then(() => logger.debug(`${fn} updated ${key} on database. (${getBenchmark(dbTime)})`))
		//  Refresh cache by deleting it
		this.redis.del(key) 
	}

	/**
	 * Give some ac for the lost of levels
	 * @param {string} [userId = ``]
	 * @param {string} [guildId = ``] 
	 * @returns {QueryResult}
	 */
	forgivenessGift(userId=``, guildId=``, level){
		let amountRoGive = 50000
		switch (level) {
			case 180:
				amountRoGive = 750000
				break
			case 100:
				amountRoGive = 600000
				break
			case 85:
				amountRoGive = 550000
				break
			case 70:
				amountRoGive = 500000
				break
			case 60:
				amountRoGive = 450000
				break
			case 50:
				amountRoGive = 400000
				break
			case 45:
				amountRoGive = 350000
				break
			case 40:
				amountRoGive = 300000
				break
			case 35:
				amountRoGive = 250000
				break
			case 30:
				amountRoGive = 200000
				break
			case 25:
				amountRoGive = 150000
				break
			case 20:
				amountRoGive = 100000
				break
			default:
				break
		}
		this.updateInventory({itemId: 52, value: amountRoGive, operation: `+`, userId: userId, guildId: guildId})
	}

	/**
	 * Setting user's experience points into `user_exp` table
	 * @param {number} [amount=0] amount to be added
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	setUserExp(amount=0, userId=``, guildId=``) {
		return this._query(`
			UPDATE user_exp 
			SET current_exp = ?
			WHERE user_id = ? AND guild_id = ?`
			, `run`
			, [amount, userId, guildId]
		)
	}

	/**
	 * Pull user's strike records if presents.
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getStrikeRecords(userId=``, guildId=``) {
		return this._query(`
			SELECT * FROM strikes
			WHERE user_id = ? and guild_id = ?
			ORDER BY datetime(registered_at) DESC`
			, `all`
			, [userId, guildId]
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
                AND item_id = 52`
            , `get`
            , [userId, guildId]
        )
        //  Fallback to zero if entry not exists.
        return res ? res.quantity : 0
    }

	/**
	 * Pull user's inventories metadata
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	async getUserInventory(userId=``,guildId=``) {
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
	async getUserPosts(userId=``,guildId=``) {
		return this._query(`
			SELECT *
			FROM user_posts
			WHERE user_id = ? AND guild_id = ?
			ORDER BY registered_at DESC`
			, `all`
			, [userId, guildId]
		)
	}
	
	/**
	 * Registering new user's post
	 * @param {UserPost} meta required parameters to register the entry
	 * @returns {QueryResult}
	 */
	registerPost({userId=``, url=``, caption=``, channelId=``, guildId=``}) {
		return this._query(`
			INSERT OR IGNORE INTO user_posts (
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
	 * Get all post data by suppling the message's original url
	 * @param {Object} url
	 */
	async getpostData({url=``}){
		return this._query(`SELECT * FROM user_posts WHERE url = ?`, `get`, [url])
	}

	/**
	 * Removes one heart to post's record and corrects amount if likes go below 0
	 * @param {Object} url
	 */
	removeHeart({url=``}){
		this._query(`UPDATE user_posts SET 
		total_likes = total_likes - 1 
		WHERE url = ?`,
		`run`
		,[url])
		let res = this._query(`SELECT * FROM user_posts WHERE url = ?`, `get`, [url])
		if (res.total_likes < 0) this._query(`UPDATE user_posts SET 
		total_likes = 0 
		WHERE url = ?`,
		`run`
		,[url])
		return
	}

	/**
	 * Adds one heart to post's record
	 * @param {Object} url, recently_liked_by
	 */
	addHeart({url=``, recently_liked_by=``}){
		return this._query(`UPDATE user_posts SET 
		recently_liked_by = ?, 
		total_likes = total_likes + 1 
		WHERE url = ?`,
		`run`
		,[recently_liked_by, url])
	}

	checkVIPStatus(userId=``, guildId=``){
		return this._query(`SELECT EXISTS (SELECT 1 FROM user_inventories WHERE item_id = 128 AND quantity = 1 AND user_id = $userId AND guildId = $guildId)`,`get`,{guildId: guildId, userId: userId})
	}

	/**
	 * Sending 10 chocolate boxes to the user's inventory
	 * @param {string} [userId=``] target user's discord id
	 * @returns {QueryResult}
	 */
	sendTenChocolateBoxes(userId=``, guildId =``) {
		return this.updateInventory({itemId: 81, value:10, operation:`+`, userId: userId, guildId: guildId})	
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
     * Registering new item type 'Custom'.
     * @return {void}
     */
    registerCustomTypeItem() {
        this._query(`
            INSERT INTO item_types(name, alias)
            VALUES(?, ?)`
            , `run`
            , [`Custom`, `ctm`]
        )
    }

	/**
	 * Pull any item metadata from `items` table. Supports dynamic search.
	 * @param {ItemKeyword} keyword ref to item id, item name or item alias.
     * @param {string} [guildId=null] Limit search to specific guild's owned items only. Optional. 
	 * @returns {QueryResult}
	 */
	getItem(keyword=``, guildId=null) {
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
        if (keyword === null && typeof guildId === `string`) return this._query(str+` WHERE owned_by_guild_id = ?`
            , `all`
            , [guildId]
        )
        //  Do single fetch on specific guild
        if (keyword && typeof guildId === `string`) return this._query(str+`
            WHERE 
                owned_by_guild_id = $guildId
                AND lower(items.name) = lower($keyword)`
            , `get`
            , {keyword: keyword, guildId: guildId}
        )
		return this._query(str+` 
			WHERE 
				items.item_id = $keyword
				OR lower(items.name) = lower($keyword)
				OR lower(items.alias) = lower($keyword)
			LIMIT 1`
			, `get`
			, {keyword: keyword}	
		)
	}

    /**
     * Migrate items table to new structure
     * @return {void}
     */
    migrateItemsTable() {
        this._query(`
            ALTER TABLE items
            ADD COLUMN usable INTEGER DEFAULT 0
        `, `run`)
        this._query(`
            ALTER TABLE items
            ADD COLUMN response_on_use TEXT
        `, `run`)
        this._query(`
            ALTER TABLE items
            ADD COLUMN owned_by_guild_id TEXT
        `, `run`)
    }

    /**
     * ----------------------------------------------
     * SHOP METHOD
     * ----------------------------------------------
     */  

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
     * Initialize shop table
     * @return {void}
     */
    createShopTable() {
        //  When inserting to this table
        //  null 'in_guild_id' column meaning that is a global shop which is hosted by Annie itself.
        return this._query(`
            CREATE TABLE IF NOT EXISTS shop(
                item_id INTEGER,
                guild_id TEXT DEFAULT NULL,
                quantity INTEGER DEFAULT -1,
                price INTEGER DEFAULT 0,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
                PRIMARY KEY(item_id),

                FOREIGN KEY(item_id)
                REFERENCES items(item_id) 
                   ON DELETE CASCADE
                   ON UPDATE CASCADE)`
            , `run`
        )
    }

	/**
	 * Pull the available price of the item.
	 * @returns {QueryResult}
	 */
	getPriceOf() {
        return {
            price: 120,
            item_price_id: 52
        }
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
     * Subtract item's supply from shop table.
     * @param {number} itemId
     * @param {number} [amount=1] Amount to subtract
     * @return {void}
     */
    subtractItemSupply(itemId, amount=1) {
        this._query(`
            UPDATE shop
            SET quantity = quantity - ?
            WHERE item_id = ?`
            , `run`
            , [amount, itemId]
        )
    }

    /**
     * Updating item's effect metadata.
     * @param {number} itemId
     * @param {string} targetProperty Target column to edit
     * @param {*} param New value for target property 
     * @return {void}
     */
    updateItemEffectsMetadata(itemId, targetProperty, param) {
        this._query(`
            UPDATE item_effects
            SET ${targetProperty} = ?
            WHERE item_id = ?`
            , `run`
            , [param, itemId]
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
	* Restock (add) to an item's quantity
	* @param {number} [itemId] target item to search.
	* @param {number} [quantity] amount to add to quantity
	* @returns {QueryResult}
	*/
	restockItem(itemId, quantity=-1) {
		const fn = `[Database.restockItem]`
		if (typeof itemId !== `number`) throw new TypeError(`${fn} parameter 'itemId' must be number.`)
		if (typeof quantity !== `number`) throw new TypeError(`${fn} parameter 'quantity' must be number.`)
		return this._query(`
			UPDATE shop
			SET quantity = $quantity
			WHERE item_id = $itemId`
			, `get`
			, {quantity: quantity, itemId: itemId}	
			, `Restocking ITEM_ID: ${itemId} (+${quantity})`
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
			, {itemId: itemId}	
		)
	}

	/**
	* return 1 or 0 if an item exists in records.
	* @param {number} [itemId] target item to search.
	* @param {number} [guildId] target item to search.
	* @returns {QueryResult}
	*/
	isValidItem(itemId, guildId) {
		const fn = `[Database.isValidItem]`
		if (typeof itemId !== `number`) throw new TypeError(`${fn} parameter 'itemId' must be number.`)
		if (typeof guildId !== `number`) throw new TypeError(`${fn} parameter 'guildId' must be number.`)
		return this._query(`
			SELECT EXISTS(SELECT * FROM items WHERE itemId = $itemId AND owned_by_guild_id = $guildId)`
			, `get`
			, {itemId: itemId, guildId: guildId}	
			, `Checking if ITEM_ID: ${itemId} belongs to GUILD_ID: ${guildId}`
		)
	}
	/**
	 * End Of Shop methods
	 */

    /**
     * -------------------------------
     * ITEM EFFECTS METHOD
     * -------------------------------
     */
    
    /**
     * Create 'item_effects' master table.
     * This table has similar structure and functionalities as guild_configurations table
     * But tailored for items only.
     * @return {QueryrResult}
     */
    createItemEffectsTable() {
        return this._query(`
            CREATE TABLE IF NOT EXISTS item_effects(
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
                    ON DELETE CASCADE)`
            , `run` 
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
     * -------------------------------
     * DURATIONAL BUFF METHOD
     * -------------------------------
     */
    
    /**
     * Create 'user_durational_buffs' master table.
     * @return {QueryResult}
     */
    createUserDurationalBuffsTable() {
        this._query(`
            CREATE TABLE IF NOT EXISTS user_durational_buffs(
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
                   ON UPDATE CASCADE)`
            , `run`
        )
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
     * Determine whether the user_durational_buffs table is exists or not.
     * @return {number}
     */ 
    async isUserDurationalBuffsTableExists() {
        const res = await this._query(`
            SELECT COUNT(*) AS has
            FROM sqlite_master
            WHERE
                type = 'table'
                AND name = 'user_durational_buffs'`
        )
        return res.has
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
        this.redis.set(cacheId, JSON.stringify(res), `EX`, 60*60)
        return res
	}

	/**
	 * 	Nullify user's exp booster in `user_exp` table.
	 *  @param {string} [userId=``] target user's id to be nullified to
	 *  @returns {QueryResult}
	 */
	nullifyExpBooster(userId=``,guildId=``) {
		return this._query(`
			UPDATE user_exp 
            SET 
            	booster_id = NULL,
            	booster_activated_at = NULL
            WHERE user_id = ? AND guild_id = ?`
            , `run`
            , [userId, guildId]
            , `EXP booster for USER_ID ${userId} in GUILd ${guildId} has been nullified.`
        )
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
	
	getRemoveBy(remove_by_date){
		return this._query(`SELECT * FROM daily_featured_post WHERE delete_by <= ?`,`all`,[remove_by_date])
	}

	deleteRecord(remove_by_date){
		return this._query(`DELETE FROM daily_featured_post WHERE delete_by <= ?`,`run`,[remove_by_date])
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
	* Enables user's notification. User will start receive notifications after executing it.
	* @param {string} [userId=``] of target user id
	* @returns {QueryResult}
	*/
	enableNotification(userId=``) {
		return this._query(`
			UPDATE users
			SET receive_notification = 1
			WHERE user_id = ?`
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
			UPDATE users
			SET receive_notification = 0
			WHERE user_id = ?`
			, `run`
			, [userId]
		)
	}
	
	/**
	 * Retrives user's notification status
	 * @param {QueryResult} [userId=``] of target user id
	 */
	getNotificationStatus(userId=``){
		return this._query(`SELECT receive_notification FROM users WHERE user_id = ?`,`get`,[userId])
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
	async indexRanking(group=``,guildId=``) {
		if (group === `exp`) return this._query(`
			SELECT 
				user_id AS id, 
				current_exp AS points 
			FROM user_exp 
			WHERE guild_id = ?
			ORDER BY current_exp DESC`
			, `all`
			, [guildId]
			, `Fetching exp leaderboard`
			, true	
		)

		if (group === `artcoins`) return this._query(`
			SELECT 
				user_id AS id, 
				quantity AS points 
			FROM user_inventories 
			WHERE item_id = 52 
				AND guild_id = ?
			ORDER BY quantity DESC`
			, `all`
			, [guildId]
			, `Fetching artcoins leaderboard`
			, true	
		)

		if (group === `fame`) return this._query(`
			SELECT 
				user_id AS id, 
				total_reps AS points 
			FROM user_reputations 
			WHERE guild_id = ?
			ORDER BY total_reps DESC`
			, `all`
			, [guildId]
			, `Fetching fame leaderboard`
			, true	
		)

		if (group === `artists`) return this._query(`
			SELECT 
				user_id AS id, 
				SUM(total_likes) AS points 
			FROM user_posts
			GROUP BY user_id
			ORDER BY points DESC`
			, `all`
			, []
			, `Fetching artists leaderboard`
			, true	
		)
	}

	
    /**
     * -------------------------------------------
     * RELATIONSHIP METHODS
     * -------------------------------------------
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
            WHERE name = ?`
            , `get`
            , [name]
        )
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
				AND user_relationships.relationship_id IS NOT NULL
			ORDER BY user_relationships.registered_at DESC`
			, `all`
			, [userId]
		)
    }

    /**
     * Migrate old relationship trees into v2 with gender-specific types
     * @return {QueryResult}
     */
    async migrateRelationshipv2() {
        //  Registering new relationship types
        await this._query(`INSERT INTO relationships(name) VALUES('parent')`, `run`, [], `registered 'parent' rel type`) 
        await this._query(`INSERT INTO relationships(name) VALUES('kid')`, `run`, [], `registered 'kid' rel type`) 
        await this._query(`INSERT INTO relationships(name) VALUES('old sibling')`, `run`, [], `registered 'old sibling' rel type`) 
        await this._query(`INSERT INTO relationships(name) VALUES('young sibling')`, `run`, [], `registered 'young sibling' rel type`) 
        await this._query(`INSERT INTO relationships(name) VALUES('couple')`, `run`, [], `registered 'couple' rel type`) 
        //  Deprecating selected old types
        await this._query(`DELETE FROM relationships WHERE name IN ('kouhai', 'senpai', 'soulmate')`, `run`, [], `Dropping 'kouhai, 'senpai', 'soulmate' rel types.`)
        //  Update old rel types into new generalized types
        await this._query(`UPDATE user_relationships SET relationship_id = (SELECT r.relationship_id FROM relationships r WHERE r.name = 'parent') WHERE relationship_id IN (1.0, 2.0)`, `run`, [], `merged 'daddy' and 'mommy' rel type as 'parent'`)
        await this._query(`UPDATE user_relationships SET relationship_id = (SELECT r.relationship_id FROM relationships r WHERE r.name = 'kid') WHERE relationship_id IN (3.0, 4.0)`, `run`, [], `merged 'son' and 'daughter' rel type as 'kid'`)
        await this._query(`UPDATE user_relationships SET relationship_id = (SELECT r.relationship_id FROM relationships r WHERE r.name = 'old sibling') WHERE relationship_id IN (5.0, 6.0)`, `run`, [], `merged 'big sister' and 'big brother' rel type as 'old sibling'`)
        await this._query(`UPDATE user_relationships SET relationship_id = (SELECT r.relationship_id FROM relationships r WHERE r.name = 'little sibling') WHERE relationship_id IN (7.0, 8.0)`, `run`, [], `merged 'little brother' and 'little sister' rel type as 'young sibling'`)
        await this._query(`UPDATE user_relationships SET relationship_id = (SELECT r.relationship_id FROM relationships r WHERE r.name = 'couple') WHERE relationship_id IN (9.0, 10.0)`, `run`, [], `merged 'boyfriend' and 'girlfriend' rel type as 'couple'`)
        //  Lowercasing 'bestfriend' rel type
        await this._query(`UPDATE relationships SET name = 'bestfriend' WHERE name = 'Bestfriend'`, `run`, [], `Normalize 'bestfriend' rel type`)
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
	 * Registering new user's relationship
	 * @param {string} [userA=``] Author's user id
	 * @param {string} [userB=``] Target user's id to be assigned
	 * @param {number} [relationshipId=0] assigned relationship's role id
	 * @param {string} [guildId=``] the guild id where the relationship is being registered in.
	 * @returns {QueryResult}
	 */
    async setUserRelationship(userA=``, userB=``, relationshipId=0, guildId=``) {
		const fn = `[Database.setUserRelationship()]`
		let res = {
			//	Insert if no data entry exists.
			insert: await this._query(`
	            INSERT INTO user_relationships (user_id_A, user_id_B, relationship_id, guild_id)
				SELECT $userA, $userB, $relationshipId, $guildId
				WHERE NOT EXISTS (SELECT 1 FROM user_relationships WHERE user_id_A = $userA AND user_id_B = $userB)`
				, `run`
				, {userA: userA, userB: userB, relationshipId: relationshipId, guildId: guildId}	
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

    /**
     * -------------------------------------------
     * GENDER METHODS
     * -------------------------------------------
     */

    /**
     * Create user_gender table
     * @return {void}
     */
    createUserGenderTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS user_gender(
			'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT,
			'gender' TEXT,
			PRIMARY KEY(user_id),
		    FOREIGN KEY(user_id)
		    REFERENCES users(user_id) 
			   ON DELETE CASCADE
			   ON UPDATE CASCADE)`
		   	, `run`
		   	, []
		)
    }

    /**
     * Pull user's gender data
     * @param {string} [userId=``] Target user id
     * @return {object|null}
     */
    getUserGender(userId=``) {
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
    async updateUserGender(userId=``, gender) {
        if (![`m`, `f`].includes(gender)) throw new TypeError(`Gender must be either 'm' or 'f'`)
        //	Insert if no data entry exists.
        const res = {
			insert: await this._query(`
	            INSERT INTO user_gender (user_id, gender)
				SELECT $userId, $gender
				WHERE NOT EXISTS (SELECT 1 FROM user_gender WHERE user_id = $userId)`
				, `run`
				, {userId:userId, gender:gender}	
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
     * Updating user's gender data
     * @param {string} [userId=``] Target user id
     * @param {string} gender New gender
     * @return {void}
     */
	 async updateUserGenderToneutral(userId=``) {
        //	Insert if no data entry exists.
        await this._query(`
	            DELETE FROM user_gender 
				WHERE user_id = $userId`
				, `run`
				, {userId:userId}	
			)
		logger.info(`[DB@UPDATE_USER_GENDER] UPDATE (GENDER: neutral)(USER_ID:${userId}`) 
    }

	setTheme(theme, userId, guildId){
		let themeToSet, themeToUnset
		if (theme == `dark`) {
			themeToSet = `3`
			themeToUnset = `4`
		} else if (theme == `light`) {
			themeToSet = `4`
			themeToUnset = `3`
		}
		this._query(`UPDATE user_inventories SET in_use = 1 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`
		,`run`
		,{theme: themeToSet, userId: userId, guildId: guildId})
		this._query(`UPDATE user_inventories SET in_use = 0 WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme`
		,`run`
		,{theme: themeToUnset, userId: userId, guildId: guildId})
		return
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	checkIfThemeOwned(theme, userId, guildId){
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme)`
		,`get`
		,{theme: theme, userId: userId, guildId: guildId})
	}

	/**
	 * Checks if the user owns the specified theme in their inventory
	 * @param {string} theme 
	 * @param {string} userId 
	 * @param {string} guildId 
	 * @returns {QueryResult} query
	 */
	GiveThemeToUser(theme, userId, guildId){
		if (theme == `dark`) {
			theme = `3`
		} else if (theme == `light`) {
			theme = `4`
		}
		return this.updateInventory({itemId: theme, value: 1, operation: `+`, userId: userId, guildId: guildId})
	}


	async findCurrentTheme(userId, guildId){
		// first see if light theme is equiped
		let res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`
		,`get`
		,{theme: `4`, userId: userId, guildId: guildId})
		if (Object.values(res)[0] == 1) return `light`
		// second see if dark theme is equiped
		res = await this._query(`SELECT EXISTS 
		(SELECT 1 FROM user_inventories WHERE user_id = $userId AND guild_id = $guildId AND item_id = $theme AND in_use = 1)`
		,`get`
		,{theme: `3`, userId: userId, guildId: guildId})
		if (Object.values(res)[0] == 1) return `dark`
		return `none`
	}


	/**
	 *  ----------------------------------------------------------
	 *  QUEST-RELATED METHODS
	 *  ----------------------------------------------------------
	 */
 	/**
 	 * Create master quest table if doesn't exist
 	 * @return {QueryResult}
 	 */
	initializeQuestTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS quests (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'quest_id' INTEGER PRIMARY KEY AUTOINCREMENT,
			'reward_amount' INTEGER DEFAULT 1,
			'name' TEXT,
			'description' TEXT,
			'correct_answer' TEXT)`
		   	, `run`
		   	, []
		   	, `Verifying quests table`
		)
	}

 	/**
 	 * Create user's quest manager table if doesn't exist
 	 * @return {QueryResult}
 	 */
	initializeUserQuestTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS user_quests (
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
			   ON UPDATE CASCADE)`
		   	, `run`
		   	, []
		   	, `Verifying user_quest table`
		)
	}

 	/**
 	 * Create quest log table if doesn't exist
 	 * @return {QueryResult}
 	 */
	initializeQuestLogTable() {
		return this._query(`CREATE TABLE IF NOT EXISTS quest_log (
			registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			quest_id INTEGER,
			user_id TEXT,
			guild_id TEXT,
			answer TEXT)`
			, `run`
			, []
			, `Verifying quest_log table`
		)
	}

 	/**
 	 * Update user's quest data after completing a quest
 	 * @param {string} [userId=``] target user's data to be updated
 	 * @param {string} [guildId=``] target guild where user's data going to be updated
 	 * @param {string} [nextQuestId=``] quest_id to be supplied on user's next quest take
 	 * @return {QueryResult}
 	 */
	updateUserQuest(userId=``, guildId=``, nextQuestId=``) {
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
	recordQuestActivity(questId=``, userId=``, guildId=``, answer=``) {
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

 	/**
 	 * Refreshing user next's quest_id
 	 * @param {string} [userId=``] target user's data to be updated
 	 * @param {string} [guildId=``] target guild where user's data going to be updated
 	 * @param {string} [nextQuestId=``] quest_id to be supplied on user's next quest take
 	 * @return {QueryResult}
 	 */
	updateUserNextActiveQuest(userId=``, guildId=``, nextQuestId=``) {
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
 	 * Pull user's quest data. It will create a new entry first if user is first-timer.
 	 * @param {string} [userId=``] target user's data to be pulled
 	 * @param {string} [guildId=``] target guild where user's data going to be pulled
 	 * @return {QueryResult}
 	 */
	async getUserQuests(userId=``, guildId=``) {
		//  Register user's quest data if not present
		await this._query(`
			INSERT INTO user_quests (updated_at, user_id, guild_id)
			SELECT datetime('now','-1 day'), $userId, $guildId
			WHERE NOT EXISTS (SELECT 1 FROM user_quests WHERE user_id = $userId AND guild_id = $guildId)`
			, `run`
			, {userId: userId, guildId: guildId}
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
	 * Check and create affiliates table if not exists
	 * @returns {boolean}
	 */
	async initializeAffiliatesTable() {
		await this._query(`CREATE TABLE IF NOT EXISTS affiliates (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'guild_id' TEXT NOT NULL,
			'description' TEXT DEFAULT 'Another awesome guild!',
			'invite_link' TEXT,
			'notes' TEXT)`
            , `run`
			, []
			, `Verifying table affiliates`
		)
		return true		
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
	 * Migrating old data (15 May)
	 * Purposely made because of #234 data-lost accident
	 * @returns {void}
	 */
    async recoverOldData() {

		await this._query(`DELETE FROM user_exp`, `run`)
		await this._query(`DELETE FROM user_inventories`, `run`)


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
		  *  Remove non-existent user_id in item_inventory (deprecated) table.
		  *  --------------------------
		  */
		await this._query(`
			DELETE FROM item_inventory
			WHERE user_id NOT IN (
				SELECT user_id 
				FROM users
			)`
			, `run`
			, []
			, `Remove non-existent user_id in item_inventory (deprecated) table.`
		)

		/**  --------------------------
		  *  Remove non-existent item_id in item_inventory (deprecated) table.
		  *  --------------------------
		  */
		await this._query(`
			DELETE FROM item_inventory
			WHERE item_id NOT IN (
				SELECT item_id 
				FROM items
			)`
			, `run`
			, []
			, `Remove non-existent item in item_inventory (deprecated) table.`
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
		 * Trade System Plugin
		 * --------------------------
		 */
		await this._query(`CREATE TABLE IF NOT EXISTS trading_trades (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT NOT NULL,
			'guild_id' TEXT NOT NULL,
			'trade_id' REAL UNIQUE NOT NULL,
			'status' TEXT NOT NULL,
			'channel' TEXT NOT NULL UNIQUE DEFAULT 0)`
            , `run`
			, []
			, `Verifying table trading_trades`)
			
		await this._query(`CREATE TABLE IF NOT EXISTS trading_transaction (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_one_id' TEXT NOT NULL,
			'user_two_id' TEXT NOT NULL,
			'guild_id' TEXT NOT NULL,
			'trade_id' TEXT NOT NULL,
			'user_one_item' TEXT NOT NULL,
			'user_two_item' TEXT NOT NULL)`
            , `run`
			, []
			, `Verifying table trading_transaction`)

			
		await this._query(`CREATE TABLE IF NOT EXISTS trading_blocked_users (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT NOT NULL UNIQUE,
			'blocked' INTEGER DEFAULT 0,
			'reason' TEXT DEFAULT 'The Moderator didnt supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.')`
            , `run`
			, []
			, `Verifying table trading_blocked_users`)
		
		/**
		 * --------------------------
		 * End of Trade System Plugin
		 * --------------------------
		 */
			
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