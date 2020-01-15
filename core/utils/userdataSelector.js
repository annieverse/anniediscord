`use-strict`
const userSelector = require(`./userSelector`)
const rank = require(`../config/ranks`)

/**
 *  This where user-related data stored.
 *  @param {Object} meta as source to be merged with.
 *  @returns {Object}
 */
class Data {
	constructor(data) {
		this.data = data
		this.db = data.bot.db
		this.requestedData = {}
	}


	/**
	 * Get closest below element from an array
	 * @param {Array} array 
	 * @param {Number|Integer} val 
	 */
	closestBelow(array=Array, val=Number) {
		return Math.max.apply(null,array.filter(function(v)
		{ return v <= val }))
	}


	async request() {
		try {
			const user = await new userSelector(this.data).get()
			let res = await this.db.userMetadata(user.id)
			const currentRankLevel = this.closestBelow(rank.DEFAULT.map(el => el.LEVEL), res.level)
			const rankData = rank.DEFAULT.filter(el => el.LEVEL === currentRankLevel)

			//	Assign new data props
			res.total_cards = await this.db.totalCollectedCards(user.id)
			res.badges = await this.db.userBadges(user.id)
			res.rank = {
				name: rankData[0].NAME,
				color: rankData[0].COLOR,
				level: rankData[0].LEVEL
			}

			delete res.badges.userId

			this.requestedData = {
				author: user,
				data: res
			}
		}
		catch(e) {
			this.requestedData = {
				author: null,
				data: null
			}
		}
	}
    
	//  Pull metadata
	async pull() {
		await this.request()
		return this.requestedData
	}
    
}

module.exports = Data