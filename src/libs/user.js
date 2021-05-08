`use-strict`
const Themes = require(`../ui/colors/themes`)
const palette = require(`../ui/colors/default`)
const getUserPermission = require(`./permissions`)

/**
 * Handles user-related data request and changes
 * @since 6.0.0
 */
class User {

    /**
     * @param {Object} bot current <AnnieClient> instance object 
     * @param {Object} message current <Message> instance object
     */
    constructor(bot, message) {
        this.bot = bot
		this.message = message
		this.logger = bot.logger
		this.guild = bot.guilds.cache.get(message.guild.id)
    }

    /**
     * Finds a user by id, or tag or plain name uses dynamic user searchstring algorithm.
     * @param {string} [target] A keyword to be used to do searchstring.
     * @author klerikdust
     * @since v7.2.1
     * @returns {object}
     */
	async lookFor(target) {
        const fn = `[User.lookFor()]`
        if (!target) throw new TypeError(`${fn} parameter "target" must be filled with target user id/tag/username/mention.`)
		//  Normalize keyword and ommits bracket if target contains mention
        target = target.toLowerCase().replace(/[^0-9a-z-A-Z ]/g, ``)
		this.args = target.split(` `)
        const collection = this.message.guild.members
		//  Lookup by full string nickname/username
		try {
			let findByFullString = await collection.fetch({query:target, limit:1})
			findByFullString = findByFullString.values().next().value.user
			if (findByFullString) {
				this.logger.debug(`${fn} successfully found user by complete string`)
				return {
					master: findByFullString,
					usedKeyword: target
				}
			}
		}
		catch(e) {
			this.logger.debug(`${fn} en error occured during user finding through full nickname/username`)
		}
		//  Lookup by full string user ID
		try {
			let findByFullStringID = await collection.fetch(target)
			findByFullStringID = collection.cache.get(target).user
			this.logger.debug(`${fn} successfully found user by complete string of user ID`)
			return {
				master: findByFullStringID,
				usedKeyword: target
			}
		}
		catch(e) {
			this.logger.debug(`${fn} an error occured during user finding through full user ID`)
		}
		//  Lookup by iterating tokens
		let findByStringToken
		let findByIDToken
		let findByCombinedStringTokens
		for (let i=0; i<this.args.length; i++) {
			const token = this.args[i]
			//  Check for string-type token
			try {
				findByStringToken = await collection.fetch({query:token, limit:1})
				findByStringToken = findByStringToken.values().next().value.user
				if (findByStringToken) {
					this.logger.debug(`${fn} successfully found user by using string token '${token}'`)
					return {
						master: findByStringToken,
						usedKeyword: token
					}
				}
			}
			catch(e) {
				this.logger.debug(`${fn} an error occured during user finding through string-type token`)
			}
			//  Check for userID-type token
			try {
				findByIDToken = await collection.fetch(token)
				findByIDToken = collection.cache.get(token).user
				if (findByIDToken) {
					this.logger.debug(`${fn} successfully found user by using ID token '${token}'`)
					return {
						master: findByIDToken,
						usedKeyword: token
					}
				}
			}
			catch(e) {
				this.logger.debug(`${fn} an error occured during user finding through userID-type token`)
			}
			//  Combine tokens and find the closest correlation
			let combinedTokens = token
			const neighbors = this.args.filter((element, index) => index !== i)
			for (let x=0; x<neighbors.length; x++) {
				const neighborToken = neighbors[x]
				combinedTokens += ` ` + neighborToken
				try {
					findByCombinedStringTokens = await collection.fetch({query:combinedTokens, limit:1})
					findByCombinedStringTokens = findByStringToken.values().next().value.user
					if (findByCombinedStringTokens) {
						this.logger.debug(`${fn} successfully found user by using combined string tokens '${combinedTokens}'`)
						return {
							master: findByCombinedStringTokens,
							usedKeyword: combinedTokens
						}
					}
				}
				catch(e) {
					this.logger.debug(`${fn} an error occured during user finding through combined tokens and close correlation`)
				}
			}
		}
		//  Fallback
		this.logger.warn(`${fn} fail to fetch user with keyword '${target}'. None of the searchstring gives adequate result.`)
		return null
    }

    /**
     * Requesting standard user metadata from Discord API and/or Database
     * @param {collection} [user] collection of user's metadata
	 * @param {number} [dataLevel=1] set to `1` to return standard user's discord structure with custom locale. Set to `2` to have an additional
	 * properties such as inventory, exp, level, reputations, etc/
     * @returns {UserMetadataObject}
     */
    async requestMetadata(user, dataLevel=1) {
		const fn = `[User.requestMetadata()]`
		const db = this.bot.db
		//  Handle if user object isn't valid
		if (!user.id || typeof user !== `object`) throw new TypeError(`${fn} parameter 'user' should be a valid collection of user metadata.`)
		try {
			//  Data checking
			const userValidate = await this.bot.db.doesUserRegisteredInTheGuild(user.id, this.message.guild.id)
			if (userValidate.is_registered === 0) {
				this.logger.info(`${fn} registering new user's metadata for ${user.id}@${this.message.guild.id}`)
				await this.bot.db.validateUser(user.id, this.message.guild.id, user.username)
			}
			/** --------------------------------------------------------------------
			 *  DATA-BLOCK LEVEL 1
			 *  --------------------------------------------------------------------
			 *  Only consists of discord properties data + user's customized locale.
			 */
			let getUserLocale = await db.getUserLocale(user.id)
			const lang = getUserLocale ? getUserLocale.lang : `en`
			if (dataLevel <= 1) return {master:user, lang:lang}

			/** --------------------------------------------------------------------
			 *  DATA-BLOCK LEVEL 2
			 *  --------------------------------------------------------------------
			 *  Consists of discord properties data + user's customized locale + extended metadata from own database.
			 */
			await db.registerGuild(this.guild)
			//  Basic data such as saved username, language, user_id and registered date
			const main = await db.getUser(user.id)
			//  User's reputations data
			const reputations = await db.getUserReputations(user.id, this.message.guild.id)
			//  User's dailies, streak and stuff
			const dailies = await db.getUserDailies(user.id, this.message.guild.id)
			//  User's relationship trees.
			const relationships = await db.getUserRelations(user.id,this.message.guild.id)
			//  User's quests data
			const quests = await db.getUserQuests(user.id, this.message.guild.id)

			//  User's parsed experience points data
			const experienceData = await db.getUserExp(user.id, this.message.guild.id)
			const parsedExp = this.bot.experienceLibs(this.message.member, this.message.guild).xpFormula(experienceData.current_exp)
			const exp = {
				raw: experienceData,
				current_exp: experienceData.current_exp,
				level: parsedExp.level,
				maxexp: parsedExp.maxexp,
				nextexpcurve: parsedExp.nextexpcurve,
				minexp: parsedExp.minexp
			}

			
			/**
			 *  --------------------------------------------------
			 *  INVENTORY MANAGEMENT
			 *  Access inventory.raw if you wanted a verbose version of inventory meta structure
			 *  --------------------------------------------------
			 */
			const inventoryData = await db.getUserInventory(user.id, this.message.guild.id)
			const simplifiedInventory = this._simplifyInventory(inventoryData)
			const inventory = {
				raw: inventoryData,
				...simplifiedInventory
			}

			/**
			 *  --------------------------------------------------
			 *  RANK MANAGEMENT
			 *  If custom ranks aren't registered in the guild yet, then use the default one instead.
			 *  There is also fallback handler in case user's level is lower than what's available in the ranks pool.
			 *  --------------------------------------------------
			 */
			const theme = inventory.raw.filter(key => (key.type_name === `Themes`) && (key.in_use === 1))
			const usedTheme = theme.length ? theme[0] : await db.getItem(`light`)
			//  If custom ranks aren't registered in the guild yet, then use the default one instead.
			const rankList = this.guild.configs.get(`RANKS_LIST`).value
			const selectedRankPool = async () => {
				if (rankList.length > 0) {
					let ranks = []
					for (let i=0; i<rankList.length; i++) {
						const node = rankList[i]
						const getRole = this.guild.roles.cache.has(node.ROLE) 
						? this.guild.roles.cache.get(node.ROLE) 
						: {
							hexColor: `#000`,
							name: node.ROLE
						}
						ranks.push({
							NAME: getRole.name,
							LEVEL: node.LEVEL,
							COLOR: getRole.hexColor
						})
					}
					return ranks
				}
				return this.bot.configs.defaultRanks
			}
			const ranks = await selectedRankPool()
			const currentRankLevel = this._closestBelow(ranks.map(node => node.LEVEL), exp.level)
			let rankData = ranks.filter(el => el.LEVEL === currentRankLevel)
			//  Handle if user's level is lower than whats available in the rank pool
			if (rankData.length <= 0) rankData = [{NAME: `Unranked`, COLOR: Themes[usedTheme.alias].text, LEVEL: currentRankLevel}] 
			const rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR === `#000000` ?  palette.crimson : rankData[0].COLOR,
				level: rankData[0].LEVEL
			}

			/**
			 *  --------------------------------------------------
			 *  MISC PROPERTIES MANAGEMENT
			 *  These might come in handy in developer's side, such as shortcut.
			 *  --------------------------------------------------
			 */
			const cover = await db.getUserCover(user.id, this.guild.id)
			let usedCover = {}
			if (cover) {
				usedCover = cover
			}
			else {
				usedCover = await db.getItem(`defaultcover1`)
				usedCover.isDefault = true
			}
			const sticker = inventory.raw.filter(key => (key.type_name === `Stickers`) && (key.in_use === 1))
			const usedSticker = sticker.length ? sticker[0] : null
			const isSelf = this.isSelf(user.id)
			const title = (await getUserPermission(this.message, user.id)).name
			return {
				master:user,
				main:main,
				lang:lang,
				reputations:reputations,
				dailies:dailies,
				relationships:relationships,
				quests:quests,
				exp:exp,
				inventory:inventory,
				theme:theme,
				usedTheme:usedTheme,
				rank:rank,
				cover:cover,
				usedCover:usedCover,
				sticker:sticker,
				usedSticker:usedSticker,
				isSelf:isSelf,
				title:title,
				usedKeyword:this.usedKeyword
			}
		}
		catch(e) {
			this.bot.logger.error(`${fn} has failed to parse user's metadata > ${e.stack}`)
			return null
		}
	}

	/**
	 * Simplify raw result from `Database.getUserInventory()`
	 * @param {object} inventory inventory metadata
	 * @returns {object}
	 * @private
	 */
	_simplifyInventory(inventory={}) {
		let obj = {}
		for (let i = 0; i < inventory.length; i++) {
			obj[inventory[i].alias] = inventory[i].quantity
		}
		return obj
	}

	/**
	 * Get closest below element from an array
	 * @param {array} [array=[]] source to be search in
	 * @param {number} [val=1] value comparator 
     * @returns {?string}
	 * @private
	 */
	_closestBelow(array=[], val=1) {
		return Math.max.apply(null,array.filter(function(v)
		{ return v <= val }))
	}

	/**
	 * Check if the message author is targetting themselves in input arg.
	 * @param {string} id
	 * @type {boolean}
	 */
	isSelf(id) {
		const fn = `[User.isSelf]`
		this.bot.logger.debug(`${fn} received from ${this.message.author.id} compare with ${id} is ${this.message.author.id === id}`)
		return this.message.author.id === id
	}

}

module.exports = User
