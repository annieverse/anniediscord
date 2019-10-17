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
			let res = await this.db.userMetadata(user.id)
			res.total_cards = await this.db.totalCollectedCards(user.id)
			res.badges = await this.db.userBadges(user.id)
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