class dataCleaner {
    constructor(client) {
        this.client = client
        this.sessionId1 = `GUILDS_IN_DB`
        this.sessionId2 = `GUILDS_NOT_IN_CACHE`
    }

    async markForDeletion(guildId) {
        return await this.client.db.guildUtils.markForDeletion(guildId)
    }

    async umarkForDeletion(guildId) {
        return await this.client.db.guildUtils.umarkForDeletion(guildId)
    }

    async getGuildsMarkedForDeletion() {
        async function broadcast(client, { sessionId1, sessionId2 }) {
            const cachedGuildIds = client.guilds.cache.map(x => x.id)
            let GUILDS_IN_DB
            if (await client.db.redis.exists(sessionId1)) {
                GUILDS_IN_DB = (await client.db.redis.get(sessionId1)).length == 0 ? [] : (await client.db.redis.get(sessionId1)).split(`:::`)
            } else {
                GUILDS_IN_DB = (await client.db.guildUtils.getAllGuildsMarkedForDeletion()).map(x => x.guild_id)
                await client.db.redis.set(sessionId1, GUILDS_IN_DB.join(`:::`), `EX`, 60 * 3)
            }
            let guildsDelete = []
            if (await client.db.redis.exists(sessionId2)) guildsDelete = (await client.db.redis.get(sessionId2)).length == 0 ? [] : (await client.db.redis.get(sessionId2)).split(`:::`)

            guildsDelete.push(GUILDS_IN_DB.filter(e => {
                if (!cachedGuildIds.includes(e)) return e
            }))
            // Make array single dimension and remove dups, then update var in memory
            guildsDelete = (guildsDelete.flat()).map(x => x)
            guildsDelete = Array.from(new Set(guildsDelete))
            await client.db.redis.set(sessionId2, guildsDelete.join(`:::`), `EX`, 60 * 3)
            let current_shard = (client.guilds.cache.first()).shard.id
            let last_shard = (client.shard.ids)[(client.shard.ids).length - 1]
            if (current_shard == last_shard) {
                await client.db.guildUtils.unmarkBulk(guildsDelete)
                client.db.redis.del(sessionId1)
            }
        }
        const sessionId1 = this.sessionId1
        const sessionId2 = this.sessionId2
        this.client.shard.broadcastEval(broadcast, { context: { sessionId1, sessionId2 } })
    }

    async deleteBulkGuilds() {
        if (!(await this.client.db.redis.exists(this.sessionId2))) return
        let sessionData = await this.client.db.redis.get(this.sessionId2)
        let guildsDelete = sessionData.length == 0 ? [] : sessionData.split(`:::`)
        if (guildsDelete.length == 0) return
        this.client.db.guildUtils.deleteBulk(guildsDelete)
        this.client.db.redis.del(this.sessionId2)
        return
    }


}

module.exports = dataCleaner