`use strict`;
const databaseManager = require(`./databaseManager`);

class Data {
    constructor(meta = {}) {
        this.meta = meta;
        this.requested_data = {};
    }

    async user() {
        return !this.meta.args[0] 
        ? this.meta.message.author
        : await this.meta.utils.userFinding(this.meta.message, this.meta.message.content.substring(this.meta.command.length + 2))
    }


    async request() {
        const user = await this.user();
        const res = new databaseManager(user.id).userMetadata;

        this.requested_data = {
            owner: this.meta.utils.name(user.id),
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