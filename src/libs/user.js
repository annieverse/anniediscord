`use-strict`
const Experience = require(`./exp`)
const Permission = require(`./permissions`)
const stringSimilarity = require('string-similarity');

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
		this.userIDPattern = /^(?:<@!?)?([0-9]+)>?$/
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
        //  Omit surrounded symbols if user using @mention method to be used as the searchstring keyword.
		if (this.userIDPattern.test(target)) target = target.replace(this.userIDPattern, `$1`)
        target = target.toLowerCase()
    	//  The acceptable rating can be adjusted between range of 0.1 to 1.
    	//  The higher the number, the more strict the result would be.
		const acceptableRating = 0.1
		const aggregatedMembers = this.message.guild.members.cache

		try {
			//  Lookup by username
			const findByUsername = stringSimilarity.findBestMatch(target, aggregatedMembers.filter(node => node.user.bot === false).map(node => node.user.username.toLowerCase()))
			if (findByUsername.bestMatch.rating >= acceptableRating) {
				const res = aggregatedMembers.filter(node => node.user.username.toLowerCase() === findByUsername.bestMatch.target).first()
				this.logger.debug(`${fn} found user with keyword '${target}' via username check. (${findByUsername.bestMatch.rating * 100}% accurate)`)
				this.user = res
				return res
			}
			//  Lookup by nickname
			const findByNickname = stringSimilarity.findBestMatch(target, aggregatedMembers.filter(node => (node.user.bot === false) && node.nickname).map(node => node.nickname.toLowerCase()))
			if (findByNickname.bestMatch.rating >= acceptableRating) {
				const res = aggregatedMembers
				.filter(node => ![null, undefined].includes(node.nickname) && (node.user.bot === false))
				.filter(node => node.nickname.toLowerCase() === findByNickname.bestMatch.target).first()
				this.logger.debug(`${fn} found user with keyword '${target}' via nickname check. (${findByUsername.bestMatch.rating * 100}% accurate)`)
				this.user = res
				return res
			}
			//  Lookup by ID
			const findByID = stringSimilarity.findBestMatch(target, aggregatedMembers.map(node => node.id))
			if (findByID.bestMatch.rating >= acceptableRating) {
				const res = aggregatedMembers.filter(node => node.id === findByID.bestMatch.target).first()
				this.logger.debug(`${fn} found user with keyword '${target}' via ID check. (${findByUsername.bestMatch.rating * 100}% accurate)`)	
				this.user = res			
				return res
			}
		}
		catch(e) {
			this.logger.error(`${fn} has failed to search user with keyword '${target}' > ${e.stack}`)
			return null
		}
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

			//  User's parsed experience points data
			console.debug(this.user.id)
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

			//  User's parsed inventory data. Access .raw if you wanted verbose version of inventory meta.
			const inventoryData = await db.getUserInventory(this.user.id, this.message.guild.id)
			const simplifiedInventory = this._simplifyInventory(inventoryData)
			this.user.inventory = {
				raw: inventoryData,
				...simplifiedInventory
			}

			//  User's current rank data based on exp level.
			const currentRankLevel = this._closestBelow(this.bot.ranks.map(el => el.LEVEL), this.user.exp.level)
			const rankData = this.bot.ranks.filter(el => el.LEVEL === currentRankLevel)
			this.user.rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR,
				level: rankData[0].LEVEL
			}

			//  User's misc properties. These might come in handy in developer's side.
			const theme = this.user.inventory.raw.filter(key => (key.type_name === `Themes`) && (key.in_use === 1))
			this.user.usedTheme = theme.length ? theme[0] : await db.getItem(`light`)
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