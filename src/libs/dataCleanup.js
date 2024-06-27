class dataCleaner {
    constructor(client) {
        this.client = client
        this.db = client.db
        this.markedGuilds = `guildsMarkedForDeletion`
        this.guildsReadyForDeletion = `guildsReadyForDeletion`
    }

    async markForDeletion(guildId) {
        return await this.db.guildUtils.markForDeletion(guildId)
    }

    async umarkForDeletion(guildId) {
        return await this.db.guildUtils.umarkForDeletion(guildId)
    }

    async getGuildsMarkedForDeletion() {
        async function broadcast(client, { guildsMarked }) {
            const cachedGuildIds = client.guilds.cache.map(guild => { if (guild.available) return guild.id })
            const DBCachedGuildIds = guildsMarked.split(`:::`)
            const readyGuilds = cachedGuildIds.filter(guild => DBCachedGuildIds.includes(guild))
            console.log(`cachedGuildIds`)
            console.log(cachedGuildIds)
            console.log(`DBCachedGuildIds`)
            console.log(DBCachedGuildIds)
            console.log(`readyGuilds`)
            console.log(readyGuilds)
            const guildsToBeDeleted = readyGuilds.join(`:::`)
            const guildsReadyForDeletion = `guildsReadyForDeletion`
            if ((await client.db.databaseUtils.doesCacheExist(guildsReadyForDeletion))) {
                // Key Exists already
                const data = await client.db.databaseUtils.getCache(guildsReadyForDeletion)
                const guilds = `${data}:::${guildsToBeDeleted}`
                client.db.databaseUtils.setCache(guildsReadyForDeletion, guilds, { EX: 60 * 3 })
            } else {
                // Key Does NOT exist
                client.db.databaseUtils.setCache(guildsReadyForDeletion, guildsToBeDeleted, { EX: 60 * 3 })
            }
        }

        this.db.databaseUtils.delCache(this.markedGuilds)
        this.db.databaseUtils.delCache(this.guildsReadyForDeletion)
        if (!(await this.db.databaseUtils.doesCacheExist(this.markedGuilds))) {
            const guildsMarkedForDeletion = await this.db.guildUtils.getAllGuildsMarkedForDeletion()
            if (!guildsMarkedForDeletion) return // No need to continue if there are no guilds to delete
            if (guildsMarkedForDeletion.length >= 0) return // No need to continue if there are no guilds to delete
            const guildCache = guildsMarkedForDeletion.join(`:::`)
            this.db.databaseUtils.setCache(this.markedGuilds, guildCache, { EX: 60 * 3 })
            return this.client.shard.broadcastEval(broadcast, { context: { guildsMarked: guildCache } })
        }

        const guilds = await this.db.databaseUtils.getCache(this.markedGuilds)
        return this.client.shard.broadcastEval(broadcast, { context: { guildsMarked: guilds } })
    }

    async deleteBulkGuilds() {
        if (!(await this.db.databaseUtils.doesCacheExist(this.guildsReadyForDeletion))) return
        const guilds = (await this.db.databaseUtils.getCache(this.guildsReadyForDeletion)).split(`:::`).toString()
        this.db.guildUtils.deleteBulk(guilds)
        this.db.databaseUtils.delCache(this.guildsReadyForDeletion)
        this.db.databaseUtils.delCache(this.markedGuilds)
        return
    }


}

module.exports = dataCleaner