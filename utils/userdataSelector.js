`use strict`;
const databaseManager = require(`./databaseManager`);
const userSelector = require(`./userSelector`);

/**
 *  Centralized Collections
 *  This where user-related data stored.
 *  @param {Object} meta as source to be merged with.
 *  @returns {Object}
 */
class Data {
    constructor(meta = {}) {
        this.meta = meta;
        this.requested_data = {};
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async request() {
        const user = await new userSelector(this.meta).get();
        const db = new databaseManager(user.id);
        let res = await db.userMetadata;

        res.total_cards = await db.totalCollectedCards()
        res.badges = db.userBadges;

        delete res.badges.userId;

        this.requested_data = {
            author: user,
            data: await res
        }
    }
    
    //  Pull metadata
    async pull() {
        return await this.request()
            .then(() => this.requested_data);
    }
    
}

module.exports = Data