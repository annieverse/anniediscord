`use-strict`
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
    }


    /**
     * Finds a user by id, or tag or plain name
     * @param {UserResolvable} target the keyword for the user (id, name, tag, snowflake)
     * @returns {GuildMemberObject}
     */
	lookFor(target) {
        const fn = `[User.lookFor()]`
        if (!target) throw new TypeError(`${fn} parameter "target" must be filled with target user id/tag/username/mention.`)

		try {
			const userPattern = /^(?:<@!?)?([0-9]+)>?$/
			if (userPattern.test(target)) target = target.replace(userPattern, `$1`)
			let members = this.message.guild.members

			const filter = member => member.user.id === target ||
                member.displayName.toLowerCase() === target.toLowerCase() ||
                member.user.username.toLowerCase() === target.toLowerCase() ||
                member.user.tag.toLowerCase() === target.toLowerCase()

			const user = members.filter(filter).first()
			if (!user) {
				this.user = null
				return null
			}
			this.user = user
			return user
		}
		catch(e) {
			this.logger.error(`${fn} has failed to find user with keyword: ${target}`)
			return null
		}
    }

    /**
     * Requesting standard user metadata from Discord API and/or Database
     * @param {string} target the keyword for the user (id, name, tag, snowflake)
	 * @param {number} [dataLevel=1] set to `1` to return standard user's discord structure with custom locale. Set to `2` to have an additional
	 * properties such as inventory, exp, level, reputations, etc/
     * @returns {UserMetadataObject}
     */
    async requestMetadata(target, dataLevel=1) {
		const fn = `[User.requestMetadata()]`
		const db = this.bot.db
		try {
			this.logger.debug(`${fn} searching for ${target}`)
			let user = this.lookFor(target)
			let getUserLocale = await db.getUserLocale(user.id)
			user.lang = getUserLocale ? getUserLocale.lang : `en`
			this.logger.debug(`${fn} found user with ID ${user.id}`)
			if (dataLevel <= 1) return user

			user.main = await db.getUser(user.id)
			user.posts = await db.getUserPosts(user.id, this.message.guild.id)
			user.socialMedias = await db.getUserSocialMedia(user.id)
			user.reputations = await db.getUserReputations(user.id, this.message.guild.id)
			user.dailies = await db.getUserDailies(user.id, this.message.guild.id)
			user.relationships = await db.getUserRelations(user.id,this.message.guild.id)

			//  Fetching exp
			const experienceData = await db.getUserExp(user.id, this.message.guild.id)
			const parsedExp = new Experience({bot: this.bot, message:this.message}).xpFormula(experienceData.current_exp)
			user.exp = {
				raw: experienceData,
				current_exp: experienceData.current_exp,
				level: parsedExp.level,
				maxexp: parsedExp.maxexp,
				nextexpcurve: parsedExp.nextexpcurve,
				minexp: parsedExp.minexp
			}

			//  Fetching inventories 
			const inventoryData = await db.getUserInventory(user.id, this.message.guild.id)
			const simplifiedInventory = this._simplifyInventory(inventoryData)
			user.inventory = {
				raw: inventoryData,
				...simplifiedInventory
			}

			//  Fetching current rank
			const currentRankLevel = this._closestBelow(this.bot.ranks.map(el => el.LEVEL), user.exp.level)
			const rankData = this.bot.ranks.filter(el => el.LEVEL === currentRankLevel)
			
			user.rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR,
				level: rankData[0].LEVEL
			}


			//  Custom properties
			const theme = this.user.inventory.raw.filter(key => (key.type_name === `Themes`) && (key.in_use === 1))
			user.usedTheme = theme.length ? theme[0] : await db.getItem(`light`)
			const cover = this.user.inventory.raw.filter(key => (key.type_name === `Covers`) && (key.in_use === 1))
			user.usedCover = cover.length > 0 ? cover[0] : await db.getItem(`defaultcover1`)
			const sticker = this.user.inventory.raw.filter(key => (key.type_name === `Stickers`) && (key.in_use === 1))
			user.usedSticker = sticker.length ? sticker[0] : null
			user.isSelf = this.isSelf
			user.title = new Permission(this.message).getUserPermission(user.id).name

			return user
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