`use strict`
const userSelector = require(`./userSelector`)

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

	async request() {
		try {
			const user = await new userSelector(this.data).get()

			//	Assign ID
			this.db.setUser = user.id

			//	Get main metadata
			let res = await this.db.userMetadata
			res.total_cards = await this.db.totalCollectedCards()
			res.badges = this.db.userBadges

			delete res.badges.userId

			this.requestedData = {
				author: user,
				data: await res
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
		return await this.request()
			.then(() => this.requestedData)
	}
    
}

module.exports = Data