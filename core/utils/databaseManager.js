const sql = require(`sqlite`)
const logger = require(`./config/winston`)

/**
  *   Accessing database globally.
  *   {databaseUtils}
  */
class databaseUtils {


	/**
        *  id represent userId in userdata column.
        *  @this.id
		*  @client is optional. for experimental purpose.
        */
	constructor(id, client) {
		this.id = id
		this.client = client
	}


	/**
	 * 	Opening connection
	 *	Use caching mode to save time on next queries.
	 *	@connect
	 */
	connect() {
		try {
			let initdb = process.hrtime()
			sql.open(`.data/database.sqlite`, {cached: true})
			logger.info(`Database successfully connected (${this.client.getBenchmark(process.hrtime(initdb))})`)
			return this
		}
		catch (e) {
			logger.error(`Database has failed to connect > ${e.stack}`)
		}
	}


	/**
	 * 	Standard low method for executing sql query
	 * 	@privateMethod
	 * 	@param {String|SQL} stmt
	 * 	@param {String|MethodName} type `get` for single result, `all` for multiple result
	 * 	and `run` to execute statement such as UPDATE/INSERT/CREATE.
	 * 	@param {ArrayOfString|Object} supplies parameters to be used in sql statement.
	 */
	async _query(stmt=``, type=`get`, supplies=[]) {

		//	Return if no statement has found
		if (!stmt) return null

		try {

			//	Run query
			let result = await sql[type](stmt, supplies)
			//	Returning query result
			return result
			
		}
		catch (e) {
			logger.error(`Database._query() has failed to run. > ${e.stack}\n${stmt}`)
			return null
		}

	}


	/**
	 * 	Parsing raw result from this.pullInventory().
	 * 	@privateMethod
	 * 	@param {Object} data inventory metadata
	 */
	_transformInventory(data = {}) {
		let obj = {}
		for (let i = 0; i < data.length; i++) {
			obj[data[i].alias] = data[i].quantity
		}
		return obj
	}


	/**
	 * 	Reversed mechanism from `._transformInventory()`.
	 * 	@privateMethod
	 * 	@param {Object} src transformed inventory metadata
	 */
	async _detransformInventory(src = {}) {
		const newInventory = []
		const keys = Object.keys(src)
		const meta = await this._query(`
			SELECT *
			FROM itemlist
			WHERE alias IN (${keys.map(() => `?`).join(`, `)})`
			, `all`
			, keys
		)
		for (let metaKey in meta) {
			for (let srcKey in src) {
				if(meta[metaKey].alias === srcKey) newInventory.push({...meta[metaKey], quantity:src[srcKey]})
			}
		}
		return newInventory
	}


	/**
	 * 	Standard low method for writing to item_inventory
	 *  @privateMethod
	 *  @param {Number|ID} itemId item id
	 *  @param {Number} value amount to be stored
	 *  @param {Symbol} operation `+` for (sum), `-` for subtract and so on.
	 *  @param {String|ID} userId user id
	 */
	async _updateInventory({itemId, value=0, operation=`+`, userId=this.id}) {
		//	Return if itemId is not specified
		if (!itemId) return {stored: false}
		//	Insert if no data entry exists.
		await this._query(`
			INSERT INTO item_inventory (item_id, user_id)
			SELECT $itemId, $userId
			WHERE NOT EXISTS (SELECT 1 FROM item_inventory WHERE item_id = $itemId AND user_id = $userId)`
			, `run`
			, {$userId: userId, $itemId: itemId}
		)
		//	Try to update available row. It won't crash if no row is found.
		await this._query(`
			UPDATE item_inventory
			SET quantity = quantity ${operation} ?
			WHERE item_id = ? AND user_id = ?`
			, `run`
			, [value, itemId, userId]
		)
		return {stored: true}
	}


	/**
	 * 	Defacto method for updating experience point
	 * 	@param {Object} data should include atleast currentexp, level, maxexp and nextexpcurve.
	 */
	updateExperienceMetadata(data = {}, userId = this.id) {
		this._query(`
			UPDATE userdata 
			SET currentexp = ?
			, level = ?
			, maxexp = ?
			, nextexpcurve = ?
			WHERE userId = ?`
			, `run`
			, [data.currentexp, data.level, data.maxexp, data.nextexpcurve, userId])
	}


	/**
	 * 	Validating if user has been registered or not.
	 * 	Returns boolean
	 * 	@param {String|ID} id user id. Use class default prop if not provided.
	 */
	async validateUser(id = this.id) {
		let res = await this._query(`
			SELECT COUNT(*) userId
			FROM userdata
			WHERE userId = ?`
			, `get`
			, [id])

		//	This returns numbers 0 || 1. But i prefer to have it in true Boolean form.
		return res.userId ? true : false
	}


	/**
	 * 	Set user's last_login.
	 * 	@param {Date|Timestamp} timestamp presence update time.
	 * 	@param {String|ID} id user id. Use class default prop if not provided.
	 */
	async updateLastLogin(timestamp = Date.now(), id = this.id) {
		await this._query(`
			UPDATE userdata
			SET last_login = ?
			WHERE userId = ?`
			, `run`
			, [timestamp, id])
	}


	/**
	 * 	Register into userdata if not present
	 * 	@param {String|ID} id user id. Use class default prop if not provided.
	 */
	async validatingNewUser(id = this.id) {
		await this._query(`
			INSERT OR IGNORE
			INTO "userdata" (userId, registered_date)
			VALUES (?, datetime('now'))`
			, `run`
			, [id]
		)
		await this._query(`
			INSERT OR IGNORE
			INTO "collections" (userId)
			VALUES (?)`
			, `run`
			, [id]
		)
		await this._query(`
			INSERT OR IGNORE
			INTO "userinventories" (userId)
			VALUES (?)`
			, `run`
			, [id]
		)
		await this._query(`
			INSERT OR IGNORE
            INTO "usercheck"(userId)
            VALUES(?)`
			, `run`
			, [id]
		)
		await this._query(`
			INSERT OR IGNORE
            INTO "userbadges"(userId)
            VALUES(?)`
			, `run`
			, [id]
		)
	}


	/**
	 * 	Distribute exp based on Naph's buff.
	 * 	@whiteCatParadise
	 */
	async whiteCatParadise() {
		const meta = this.client.cards.naph_card.skills.main
		const res = await this._query(`
			UPDATE userdata
			SET currentexp = currentexp + ?
			WHERE userId IN (SELECT userId FROM collections WHERE naph_card = 1)`
			, `run`
			, [meta.effect.exp]
		)

		logger.info(`[${meta.name}] : ${res.stmt.changes} users have received ${meta.effect.exp} EXP`)
	}


	/**
	 * 	Set all cooldown to zero
	 * 	@resetCooldown
	 */
	resetCooldown() {
		this._query(`
			UPDATE usercheck
			SET expcooldown = "False"`
			, `run`
		)
	}


	/**
     * Lifesaver promise. Used pretty often when calling an API.
     * @pause
     */
	pause(ms) {
		return new Promise(resolve => setTimeout(resolve, ms))
	} // End of pause


	//  Pull neccesary data at once.
	async userMetadata(userId = this.id) {
		let main = await this._query(`
			SELECT *
			FROM userdata
			INNER JOIN usercheck
			ON usercheck.userId = userdata.userId
			WHERE userdata.userId = ?`
			, `get`
			, [userId]
		)

		let inventory = await this.pullInventory(userId)

		return {...main, ...this._transformInventory(inventory)}
	}


	/**
	 * 	Registering post metadata
	 * 	@param {String|ID} userId
	 * 	@param {ResolvableURL} url
	 * 	@param {String|ID} location
	 * 	@registerPost
	 */
	registerPost({userId=``, url=``, location=``, description=``}) {
		this._query(`
			INSERT INTO userartworks (
				userId
				, url
				, timestamp
				, location
				, description
			)
			VALUES (?, ?, datetime('now'), ?, ?)`,
			`run`
			, [userId, url, location, description]
		)
	}

	userArtworks(userId = this.id) {
		return sql.get(`
                SELECT *
                FROM userartworks
                WHERE userId = "${userId}"
                ORDER BY timestamp DESC
            `).then(async parsed => parsed)
	}

	/**
	 * 	Sending 10 chocolate boxes
	 * 	@param {String|ID} id
	 * 	@sendTenChocolateBoxes
	 */
	sendTenChocolateBoxes(userId = this.id) {
		this._query(`
			UPDATE userinventories
			SET chocolate_box = chocolate_box + 10
			WHERE userId = ?`,
			`run`
			, [userId]
		)		
	}

	userBadges(userId = this.id) {
		return sql.get(`
                SELECT *
                FROM userbadges
                WHERE userId = "${userId}"
            `).then(async parsed => parsed)
	}


	getItemMetadata(id = 0) {
		return this._query(`
			SELECT *
			FROM itemlist 
			WHERE itemId IN ?`
			, `all`
			, [id]
		)
	}

	maintenanceUpdate(){
		return sql.run(`
				UPDATE userinventories
				SET artcoins = artcoins + 1000 
			`)
	}

	//  Accepts one level of an object. Returns sql-like string.
	toQuery(data) {
		let res = ``
		for (let key in data) {
			res += `${key} = ${key} - ${data[key]},`
		}
		res = res.replace(/.$/, ` `)
		return res
	}

	//  Withdrawing multiple columns value
	consumeMaterials(cardmeta) {
		sql.run(`
                UPDATE userinventories
                SET ${this.toQuery(cardmeta)} 
                WHERE userId = "${this.id}"
            `)
		return this
	}

	//  Set one value into card column
	registerCard(card_alias) {
		sql.run(`
                UPDATE collections
                SET ${card_alias} = 1
                WHERE userId = "${this.id}"
            `)
		return this
	}

	
	/**
	 * 	Event Manager toolkit. Sending package of reward to user. Supports method chaining.
	 * 	@param {Number|UserArtcoins} artcoins ac
	 *  @param {Number|UserGachaTicket} lucky_ticket ticket
	 *  @deliverRewardItems
	 */
	async deliverRewardItems({artcoins, lucky_ticket}) {
		await this.storeArtcoins(artcoins)
		await this.addLuckyTickets(lucky_ticket)
		return this
	}


	/**
	 * 	Updating user lucky ticket. Support method chaining.
	 * 	@param {Number} value amount of lucky ticket to be given
	 * 	@addLuckyTickets
	 */
	async addLuckyTickets(value = 0) {
		await this._updateInventory({itemId: 71, value:value, operation:`+`})
		return this
	}


	/**
	 * 	Add user artcoins. Supports method chaining.
	 * 	@param {Number} value of the artcoins to be given
	 * 	@param {String|ID} userId of the user id
	 * 	@storeArtcoins
	 */
	async storeArtcoins(value) {
		await this._updateInventory({itemId: 52, value: value, operation: `+`})
		return this
	}


	updateSkin(newvalue) {
		sql.run(`UPDATE userdata 
            SET interfacemode ="${newvalue}" 
            WHERE userId = ${this.id}`)
	}

	updateCover(newvalue) {
		sql.run(`UPDATE userdata 
            SET cover = "${newvalue}"
            WHERE userId = ${this.id}`)
	}

	async updateBadge(newvalue) {
		let badgedata = await this.userBadges()
		let slotkey = Object.keys(badgedata)
		let slotvalue = Object.values(badgedata)
		sql.run(`UPDATE userbadges 
            SET ${slotkey[slotvalue.indexOf(null)]} = "${newvalue}" 
            WHERE userId = ${this.id}`)
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
                SET currentexp = 0,
                maxexp = 100,
                nextexpcurve = 150,
                level = 0
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
	 * 	Withdrawing specific item from user inventory
	 * 	@param {Number} value as amount to be withdraw
	 * 	@param {Number} item_id as item id reference
	 * 
	 */
	withdraw(value, item_id) {
		this._query(`
			UPDATE item_inventory 
            SET quantity = quantity - ?
			WHERE item_id = ? AND user_id = ?`
			, `run`
			, [value, item_id, this.id]
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



	get luckyTicketDropRates() {
		return sql.all(`SELECT DISTINCT drop_rate FROM luckyticket_rewards_pool WHERE availability = 1`)
	}

	lootGroupByRate(rate) {
		return sql.get(`SELECT * FROM luckyticket_rewards_pool WHERE drop_rate = ${rate} AND availability = 1 ORDER BY RANDOM() LIMIT 1`)
	}


	/**
     * Subtracting tickets by result of roll_type().
	 * @param {Number} value amount to be subtracted
     * @substract_ticket
    */
	withdrawLuckyTicket(value = 0) {
		this._updateInventory({itemId: 71, value: value, operation:`-`})
	}


	//	Count total user's collected cards.
	async totalCollectedCards(userId = this.id) {
		const data = await sql.get(`SELECT * FROM collections WHERE userId = ${userId}`)
		for (let key in data) {
			if (!data[key]) delete data[key]
		}
		return Object.keys(data).length
	}


	/**
     *  Storing rolled items straight into user inventory
     *  @param {Object} obj as parsed object of roll metadata (require baking in `._detransformInventory()`).
     */
	async storingUserGachaMetadata(obj = {}) {
		for (let key in obj) {
			let data = obj[key]
			await this._updateInventory({itemId: data.itemId, value: data.quantity})
		}
	}


	/**
     * Adding user reputation points
     * @param {Integer} amount Updated/added amount of user's reputation points
     */
	addReputations(amount = 0, userId = this.id) {
		return sql.run(`UPDATE userdata
                            SET reputations = CASE WHEN reputations IS NULL
                                                THEN ${amount}
                                              ELSE reputations + ${amount}
                                            END
                            WHERE userId = "${userId}"`)
	}


	get inventory() {
		return sql.get(`
                SELECT *
                FROM userinventories
                WHERE userId = "${this.id}"`)
	}

	pullInventory(id = this.id) {
		return this._query(`
                SELECT *
				FROM item_inventory
				INNER JOIN itemlist
				ON itemlist.itemId = item_inventory.item_id
				WHERE item_inventory.user_id = ?`
				, `all`
				, [id])
	}

	//  Store new heart point
	addHeart() {
		sql.run(`
            UPDATE userdata 
            SET liked_counts = liked_counts + 1 
            WHERE userId = "${this.id}"
            `)
	}

	//  Enable user's notification
	enableNotification(userId=this.id) {
		sql.run(`
                UPDATE userdata
                SET get_notification = 1
                WHERE userId = "${userId}"
            `)
	}

	//  Disabled user's notification
	disableNotification(userId=this.id) {
		sql.run(`
                UPDATE userdata
                SET get_notification = -1
                WHERE userId = "${userId}"
            `)
	}
        
	//  Check if post already stored in featured list
	featuredPostMetadata(url) {
		return sql.get(`
                SELECT *
                FROM featured_post
                WHERE url = "${url}"
            `)
	}

	//  Register new featured post metadata
	registerFeaturedPost({timestamp=0, url=``, author=``, channel=``, heart_counts=0, last_heart_timestamp=Date.now()}) {
		sql.run(`
                INSERT INTO featured_post
                (timestamp, url, author, channel, heart_counts, last_heart_timestamp)
                VALUES (?, ?, ?, ?, ?, ?)`,
		[timestamp, url, author, channel, heart_counts, last_heart_timestamp]
		)
	}

	/**
            *   Getting keys from object
            * @src: an object of data to be pulled from.
            */
	storingKey(src) {
		let container = []
		for(let i in src) { container.push(i) }
		return container
	}

            
	/**
            *   Getting value from object keys
            * @src: an object of data to be pulled from.
            */
	storingValue(src) {
		let container = []
		for(let q in src) { container.push(src[q]) }
		return container 
	}


	/**
            *   Getting value from object keys
            * @src: an object of data to be pulled from.
            * @ele: target key.
            */
	storingValueOfElement(src, ele) {
		let container = []
		for(let q in src) { container.push(src[q][ele]) }
		return container 
	}
                

	/**
            *   Register new item.
            *   @param name of item name.
            *   @param alias of item source alias.
            *   @param type of item type.
            *   @param price of item price.
            *   @param description of item description.
            */
	registerItem(name, alias, type, price, description) {
		return sql.get(`INSERT INTO itemlist (name, alias, type, price, desc) VALUES (?, ?, ?, ?, ?)`, [name, alias, type, price, description])
	}



	/**
        *   Register new ID into table.
        * @param tablename of target table.
        * @param id of userId
        */
	registeringId(tablename, id) {
		return sql.run(`INSERT INTO ${tablename} (userId) VALUES (?)`, [id])
	}


	/**
        *   Register new column into given table.
        * @param tablename of target table.
        * @param columnname of new column.
        * @param type of column type.
        */
	registerColumn(tablename, columnname, type) {
		return sql.get(`ALTER TABLE ${tablename} ADD COLUMN ${columnname} ${type}`)
	}


	/**
    *   Register new table.
    * @param tablename of target table.
    * @param columnname of target column.
    * @param type of column type.
    */
	registerTable(tablename, columnname, type) {
		return sql.get(`CREATE TABLE IF NOT EXISTS ${tablename} (${columnname} ${type.toUpperCase()})`)
	}


	/**
    *   Sum up value on column of table.
    * @param tablename of target table.
    * @param columnname of target column.
    * @param value of new value to be added on.
    *   @param id of target userid.
    */
	sumValue(tablename, columnname, value, id, idtype = `userId`) {
		return sql.get(`SELECT * FROM ${tablename} WHERE ${idtype} ="${id}"`)
			.then(async currentdata => {
				sql.run(`UPDATE ${tablename} SET ${columnname} = ${currentdata[columnname] === null ? parseInt(value) : currentdata[columnname] + parseInt(value)} WHERE ${idtype} = ${id}`)
			})
	}

	/**
     * Extendable function to add values to any table
     * 
     * @param {string} tablename the name of the table
     * @param {string} columnnames the name of the columns ie. 'col1, col2, col3, etc'
     * @param {string} values the input values ie. ''this is val 1', 'this is val 2', 'val3'
     */
	addValues(tablename, columnnames, values) {
		return sql.run(`INSERT INTO ${tablename}(${columnnames}) VALUES (${values})`)
	}

	updateValue(tablename, columnNameToUpdate, value, columnname, id) {
		try {
			sql.run(`UPDATE ${tablename} SET ${columnNameToUpdate} = '${value}' WHERE ${columnname} = '${id}'`)
		} catch (error) { throw error }
	}
	/**
    *   Subtract value on column of table.
    * @param tablename of target table.
    * @param columnname of target column.
    * @param value of new value to be added on.
    *   @param id of target userid.
    */
	subtractValue(tablename, columnname, value, id) {
		return sql.get(`SELECT * FROM ${tablename} WHERE userId ="${id}"`)
			.then(async currentdata => {
				sql.run(`UPDATE ${tablename} SET ${columnname} = ${currentdata[columnname] === null ? 0 : currentdata[columnname] - parseInt(value)} WHERE userId = ${id}`)
			})
	}


	/**
     *  Replacing value on column of table.
     *  @param tablename of target table.
     *  @param columnname of target column.
     *  @param value of new value to be added on.
     *  @param id of target userid.
     *  @param idtype of the id type (default: "userId")
     */
	replaceValue(tablename, columnname, value, id, idtype = `userId`) {
		return sql.run(`UPDATE ${tablename} SET ${columnname} = "${value}" WHERE ${idtype} = ${id}`)
	}



	/**
        *   Pull id data from given table.
        * @param tablename of target table.
        * @param id of userId
        */
	pullRowData(tablename, id, idtype = `userId`) {
		return sql.get(`SELECT * FROM ${tablename} WHERE ${idtype} = ${id}`).then(async parsed => parsed)
	}

	/**
        *   Pull data from given table.
        * @param tablename of target table.
        * @param id of userId
        */
	pullData(tablename) {
		return sql.all(`SELECT * FROM ${tablename}`).then(async parsed => parsed)
	}


	/**
        *     Registering item type into shop.
        *   @param type of item type.
        *     @param opt of additional filter option. (default: "price < 999999")
        */
	classifyItem(type, opt = `price > 0`, order = `price ASC`) {
		return sql.all(`SELECT name, type, price, desc FROM itemlist WHERE type = "${type.toString()}" AND status = "sell" AND ${opt} ORDER BY ${order}`).then(async parsed => parsed)
	}

	/**
	 *     Registering item type into shop.
	 *   @param status of item type.
	 *     @param opt of additional filter option. (default: "price < 999999")
	 */
	classifyLtdItem(status, opt = `price > 0`, order = `price ASC`) {
		return sql.all(`SELECT name, type, price, desc FROM itemlist WHERE status = "${status.toString()}-sale" AND ${opt} GROUP BY type ORDER BY ${order}`).then(async parsed => parsed)
	}

	/**
	 *     Get column of the currency
	 *   @param currency type
	 */
	getCurrency(currency) {
		return sql.all(`SELECT ${currency} FROM userinventories`)
	}

	/**
	 *     Create column of the currency
	 *   @param currency type
	 */
	makeCurrency(currency) {
		return sql.all(`ALTER TABLE userinventories ADD ${currency} INTEGER DEFAULT 0`)
	}

	/**
	 *     Get users with more than 0 currency
	 *   @param currency type
	 */
	getUsersWithCurrency(currency) {
		return sql.all(`SELECT * FROM userinventories WHERE ${currency} > 0`)
	}

	/**
	 *     Sets currency to 0 and increases AC
	 *   @param currency type
	 */
	convertCurrencyToAc(currency, newac, userId) {
		return sql.all(`UPDATE userinventories SET ${currency} = 0, artcoins = ${newac} WHERE userId = ${userId}`)
	}

	/**
        *   Find item on given array.
        *   Ignoring word case
        * @param src of target array.
        * @param id of target element in given src.
        */
	request_query(callback, itemname) {
		return sql.all(`SELECT upper(name), alias, type, price, desc, status, rarity FROM itemlist WHERE status = "sell"`)
			.then(() => callback(callback, itemname))
	}


	// Returns key-value
	lookfor(src, name) {
		for (let i in src) {
			if (src[i] === name.toUpperCase()) {
				return src[i]
			}
		}
	}


	// Get item obj.
	get_item(itemname) {
		return this.request_query(this.lookfor, itemname)
	}



	/**
        *   Get package obj from packagelist.
        * @param name of package name.
        */
	async pullPackage(name) {
		let src = await this.wholeIndexing(`packagelist`)
		let filtered = await this.storingValueOfElement(src, `name`)
		let itemIndex = this.itemIndexing(filtered, name)

		return sql.get(`SELECT * FROM packagelist WHERE name = "${itemIndex.toString()}"`).then(async parsed => parsed)
	}



	/**
        *   Pulling item aliases from given package.
        * @param pkg of parsed pkg object.
        */
	async packageAlias(pkg) {

		let aliases = []
		for (let i = 1; i <= 3; i++) {
			sql.get(`SELECT alias FROM itemlist WHERE itemId = ${(pkg[`item` + i.toString()])}`)
				.then(async parsed => await aliases.push(parsed.alias))

			if (i === 3) { break }
		}
		await this.pause(1000)
		return aliases
	}



	/**
      * Returns true if the given package's badge was present in their userbadges.
      * Otherwise, false.
      * @param id of packagename
      * @param userbadges of user badges collection.
      */
	async packageCrossCheck(id, userbadges) {
		let targetPackage = await this.pullPackage(id)
		let data = await this.packageAlias(targetPackage)
		return data.every(e => userbadges.includes(e))
	}



	/**
      * Pull collection of table data.
      * @param tablename
      */
	wholeIndexing(tablename, opt = ``) {
		return sql.all(`SELECT * FROM ${tablename} ${opt}`)
			.then(async parsed => parsed)
	}


	/**
        *   Delete row data from given table.
        * @param tablename of target table.
        * @param id of userId
        * @param idtype of the id type.
        */
	removeRowData(tablename, id, idtype = `userId`) {
		return sql.run(`DELETE FROM ${tablename} WHERE ${idtype} = ${id}`)
	}




	/**
        *   Pull ID ranking based on given descendant column order.
        * @param tablename of target table.
        * @param columnname of sorted descendant column. 
        * @param index of user.
        * @param val of returned data value.
        */
	indexRanking(tablename, columnname, index, val) {
		return sql.all(`SELECT ${val} FROM ${tablename} ORDER BY ${columnname} DESC`)
			.then(async x => x[index][val])
	}




	/**
        *   Pull Author ID ranking based on given descendant column order.
        * @param tablename of target table.
        * @param columnname of sorted descendant column. 
        */
	authorIndexRanking(tablename, columnname, id = this.id) {
		return sql.all(`SELECT userId FROM ${tablename} ORDER BY ${columnname} DESC`)
			.then(async x => x.findIndex(z => z.userId === id))
	}




	/**
        *   Pull packages from packagelist.
        */
	get packageCollections() {
		return sql.get(`SELECT * FROM packagelist`).then(async parsed => parsed)
	}



	/**
        *   Pull total user collection size.
        */
	get userSize() {
		return sql.all(`SELECT * FROM userdata`)
			.then(async x => x.length)
	}


	/**
        *   Pull user collection of data.
        * @this.id
        */
	get userDataQuerying() {
		return sql.get(`SELECT * FROM userdata WHERE userId = ${this.id}`)
			.then(async parsed => parsed)
	}


	/**
        *   Pull user badges container of data.
        * @this.id
        */
	get badgesQuerying() {
		return sql.get(`SELECT * FROM userbadges WHERE userId = ${this.id}`)
			.then(async parsed => parsed)
	}


	/**
        *   Pull all the registered user data.
        * @this.id
        */
	get queryingAll() {
		return sql.all(`SELECT userId FROM userdata ORDER BY currentexp DESC`)
			.then(async parsed => parsed)
	}


	/**
        *   Pull all the available tables.
        * @no params
        */
	get listedTables() {
		return sql.all(`SELECT * FROM sqlite_master WHERE type='table'`)
			.then(async parsed => parsed)
	}


	/**
        *   Referenced to @userDataQuerying.
        * @this.userDataQuerying
        */
	get userdata() {
		return this.userDataQuerying
	}


	/**
        *   Referenced to @badgesQuerying.
        * @this.badgesQuerying
        */
	get badges() {
		return this.badgesQuerying
	}


	/**
	 *   Pull user ranking data counted from all indexes.
	 * @this.queryingAll
	 */
	get ranking() {
		return this.queryingAll
			.then(async data => data.findIndex(x => x.userId === this.id))
	}

    /**
     *   Pull user's relationships with other members with main relationship on top if it exists
     */
    get relationships() {
        return sql.all(`SELECT 
                        r1.type AS "myRelation", r2.type AS "theirRelation",
                        userId1 as "myUserId", userId2 AS "theirUserId"
						FROM relationship r
						JOIN relationshiptype r1
						ON r.relationType1 = r1.typeId
						JOIN relationshiptype r2
						ON r.relationType2 = r2.typeId
						WHERE r.userId1 = ${this.id} AND relationType1 > 0 AND relationType2 > 0
						 
						UNION
						
						SELECT 
                        r1.type AS "myRelation", r2.type AS "theirRelation",
                        userId2 as "myUserId", userId1 AS "theirUserId"
						FROM relationship r
						JOIN relationshiptype r1
						ON r.relationType2 = r1.typeId
						JOIN relationshiptype r2
						ON r.relationType1 = r2.typeId
						WHERE r.userId2 = ${this.id} AND relationType1 > 0 AND relationType2 > 0
                   		`)
            .then(async parsed => parsed)
		/*
		* CASE WHEN EXISTS(SELECT 1
                        	FROM mainrelationship main
                        	WHERE r.userId1 = main.userId1
                        	AND r.userId2 = main.userId2) THEN 1 ELSE 0 END AS isMain,
                        	* relationStart, relationPoints, recentReceived AS "gift"
        * CASE WHEN EXISTS(SELECT 1
                        	FROM mainrelationship main
                        	WHERE userId2 = main.userId1
                        	AND userId1 = main.userId2) THEN 1 ELSE 0 END AS isMain,
                        	* relationStart, relationPoints, recentGifted AS "gift"
		* ORDER BY isMain DESC*/
    }

    /**
     *   Pull available relationship types
     */
    get relationshipTypes() {
        return sql.all(`SELECT * FROM relationshiptype ORDER BY typeId ASC`)
            .then(async parsed => parsed)
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
			/*.then(
				sql.run(`
					DELETE FROM mainrelationship 
					WHERE userId2 = "${this.id}" AND userId1 = "${userId}"
				`)
		)
			 */
	}

	/*
	async setMainRelationship(userId) {
		var res = await sql.all(`SELECT * FROM mainrelationship WHERE userId1 = "${this.id}"`)
		if (res.length > 0) {
			return sql.run(`
                UPDATE mainrelationship
                SET userId2 = ${userId} 
                WHERE userId1 = "${this.id}"
            `)
		}
		return sql.run(`
                INSERT INTO mainrelationship
                (userId1, userId2)
                VALUES (?, ?)`,
			[this.id, userId])
	}


	async setRelationshipGift(userId, amount, gift) {
		await sql.run(`
                UPDATE relationship
                SET relationPoints = relationPoints + ${amount}
                AND recentReceived = "${gift}"
                WHERE userId1 = "${this.id}" AND userId2 = "${userId}"
            `)
		await sql.run(`
                UPDATE relationship
                SET relationPoints = relationPoints + ${amount}
                AND recentGifted = "${gift}"
                WHERE userId2 = "${this.id}" AND userId1 = "${userId}"
            `)
	}
	*/


}

module.exports = databaseUtils
