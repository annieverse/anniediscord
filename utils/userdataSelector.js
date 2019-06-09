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


    async request() {
        const user = await new userSelector(this.meta).get();
        const res = new databaseManager(user.id).userMetadata;

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