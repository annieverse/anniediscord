`use-strict`
const rank = require(`../config/ranks`)
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

			return members.filter(filter).first()
		}
		catch(e) {
			return null
		}
    }
    

    /**
     * Requesting standard user metadata from database.
     * @param {UserResolvable} target the keyword for the user (id, name, tag, snowflake)
     * @returns {UserMetadataObject}
     */
    async requestMetadata(target) {
		try {
			const user = this.lookFor(target)
			let res = await this.bot.db.userMetadata(user.id)
			const currentRankLevel = this._closestBelow(rank.DEFAULT.map(el => el.LEVEL), res.level)
			const rankData = rank.DEFAULT.filter(el => el.LEVEL === currentRankLevel)

			//	Assign new data props
			res.total_cards = await this.bot.db.totalCollectedCards(user.id)
			res.badges = await this.bot.db.userBadges(user.id)
			res.rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR,
				level: rankData[0].LEVEL
			}

			delete res.badges.userId
			return res
		}
		catch(e) {
			return null
		}
    }


	/**
	 * Get closest below element from an array
	 * @param {Array} array 
	 * @param {Number|Integer} val 
     * @returns {ElementOfArray}
	 */
	_closestBelow(array=Array, val=Number) {
		return Math.max.apply(null,array.filter(function(v)
		{ return v <= val }))
	}
}

module.exports = User