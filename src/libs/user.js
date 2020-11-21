`use-strict`
const Themes = require(`../ui/colors/themes`)
const Experience = require(`./exp`)
const Permission = require(`./permissions`)

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
     * @returns {GuildMember}
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
				this.user = findByFullString
				this.usedKeyword = target
				return this.user
			}
		}
		catch(e){}
		//  Lookup by full string user ID
		try {
			let findByFullStringID = await collection.fetch(target)
			findByFullStringID = collection.cache.get(target).user
			this.logger.debug(`${fn} successfully found user by complete string of user ID`)
			this.user = findByFullStringID
			this.usedKeyword = target
			return this.user
		}
		catch(e){}
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
					this.user = findByStringToken
					this.usedKeyword = token
					return this.user
				}
			}
			catch(e){}
			//  Check for userID-type token
			try {
				findByIDToken = await collection.fetch(token)
				findByIDToken = collection.cache.get(token).user
				if (findByIDToken) {
					this.logger.debug(`${fn} successfully found user by using ID token '${token}'`)
					this.user = findByIDToken
					this.usedKeyword = token
					return this.user
				}
			}
			catch(e){}
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
						this.user = findByCombinedStringTokens
						this.usedKeyword = combinedTokens
						return this.user
					}
				}
				catch(e){}
			}
		}
		//  Fallback
		this.logger.warn(`${fn} fail to fetch user with keyword '${target}'. None of the searchstring gives adequate result.`)
		this.user = null
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
			this.user = user
			//  Data checking
			const userValidate = await this.bot.db.doesUserRegisteredInTheGuild(this.user.id, this.message.guild.id)
			if (userValidate.is_registered === 0) await this.bot.db.validateUser(this.user.id, this.message.guild.id, this.user.username)
			/** --------------------------------------------------------------------
			 *  DATA-BLOCK LEVEL 1
			 *  --------------------------------------------------------------------
			 *  Only consists of discord properties data + user's customized locale.
			 */
			let getUserLocale = await db.getUserLocale(user.id)
			this.user.lang = getUserLocale ? getUserLocale.lang : `en`
			if (dataLevel <= 1) return this.user

			/** --------------------------------------------------------------------
			 *  DATA-BLOCK LEVEL 2
			 *  --------------------------------------------------------------------
			 *  Consists of discord properties data + user's customized locale + extended metadata from own database.
			 */
			await db.registerGuild(this.guild)
			//  Basic data such as saved username, language, user_id and registered date
			this.user.main = await db.getUser(this.user.id)
			//  User's past posted messages that were recorded by Annie.
			this.user.posts = await db.getUserPosts(this.user.id, this.message.guild.id)
			//  User's list of registered social medias
			this.user.socialMedias = await db.getUserSocialMedia(this.user.id)
			//  User's reputations data
			this.user.reputations = await db.getUserReputations(this.user.id, this.message.guild.id)
			//  User's dailies, streak and stuff
			this.user.dailies = await db.getUserDailies(this.user.id, this.message.guild.id)
			//  User's relationship trees.
			this.user.relationships = await db.getUserRelations(this.user.id,this.message.guild.id)
			//  User's quests data
			this.user.quests = await db.getUserQuests(this.user.id, this.message.guild.id)

			//  User's parsed experience points data
			const experienceData = await db.getUserExp(this.user.id, this.message.guild.id)
			const parsedExp = new Experience({bot: this.bot, message:this.message}).xpFormula(experienceData.current_exp)
			this.user.exp = {
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
			const inventoryData = await db.getUserInventory(this.user.id, this.message.guild.id)
			const simplifiedInventory = this._simplifyInventory(inventoryData)
			this.user.inventory = {
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
			const theme = this.user.inventory.raw.filter(key => (key.type_name === `Themes`) && (key.in_use === 1))
			this.user.usedTheme = theme.length ? theme[0] : await db.getItem(`light`)
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
			const currentRankLevel = this._closestBelow(ranks.map(node => node.LEVEL), this.user.exp.level)
			let rankData = ranks.filter(el => el.LEVEL === currentRankLevel)
			//  Handle if user's level is lower than whats available in the rank pool
			if (rankData.length <= 0) rankData = [{NAME: `No Rank`, COLOR: Themes[this.user.usedTheme.alias].text, LEVEL: currentRankLevel}] 
			this.user.rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR,
				level: rankData[0].LEVEL
			}

			/**
			 *  --------------------------------------------------
			 *  MISC PROPERTIES MANAGEMENT
			 *  These might come in handy in developer's side, such as shortcut.
			 *  --------------------------------------------------
			 */
			const cover = user.inventory.raw.filter(key => (key.type_name === `Covers`) && (key.in_use === 1))
			this.user.usedCover = cover.length > 0 ? cover[0] : await db.getItem(`defaultcover1`)
			const sticker = user.inventory.raw.filter(key => (key.type_name === `Stickers`) && (key.in_use === 1))
			this.user.usedSticker = sticker.length ? sticker[0] : null
			this.user.isSelf = this.isSelf
			this.user.title = new Permission(this.message).getUserPermission(this.user.id).name
			return this.user
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
	 * @type {boolean}
	 */
	get isSelf() {
		const fn = `[User.isSelf]`
		this.bot.logger.debug(`${fn} received from ${this.message.author.id} compare with ${this.user.id} is ${this.message.author.id === this.user.id}`)
		return this.message.author.id === this.user.id
	}

}

module.exports = User