const Discord = require(`discord.js`)

/**
 *  Fetching emojis across all shards.
 *  @param {string} emojiKeyword emoji's ID/Snowflake/Name
 *  @param {object} client Current client instance
 *  @return {string|Discord.Emoji} 
 */
const emojiFetch = async (emojiKeyword, client, serverId) => {
    const cacheId = `EMOJI_CACHE_${emojiKeyword}`
    //  Check on own client first.
    const onCache = await client.db.databaseUtils.getCache(cacheId)
    // const onCache = await client.db.redis.get(cacheId)
    if (onCache) {
        //  Use cache for faster response
        return onCache
    }

    function findEmojiFromServer(guild, nameOrId) {
        return guild.emojis.cache.get(nameOrId) || guild.emojis.cache.find(e => e.name.toLowerCase() === nameOrId.toLowerCase())
    }

    if (serverId) {
        const guild = await client.guilds.fetch(serverId)
        await guild.emojis.fetch() // prevent Caching issues
        const findingEmoji = findEmojiFromServer(guild, emojiKeyword)
        const foundEmoji = findingEmoji.find(emoji => emoji)
        if (!foundEmoji) return `(???)`
        const emoji = guild.emojis.resolve(FoundEmoji.id) 
        client.db.databaseUtils.setCache(cacheId,emoji.toString(),{EX:(60*60)*12})
        // await client.db.redis.set(cacheId, emoji.toString(), {EX: 60*60*12})
        return emoji
    }

    function findEmoji(c, { nameOrId }) {
        return c.emojis.cache.get(nameOrId) || c.emojis.cache.find(e => e.name.toLowerCase() === nameOrId.toLowerCase())
    }
    const findingEmoji = client.shard.broadcastEval(findEmoji, { context: { nameOrId: emojiKeyword } }).then(emojiArray => {
        const foundEmoji = emojiArray.find(emoji => emoji)
        if (!foundEmoji) return `(???)`
        return foundEmoji
    })
    const FoundEmoji = await findingEmoji
    if (FoundEmoji === `(???)`) return `(???)`
    const guild = await client.guilds.fetch(FoundEmoji.guildId)
    const emoji = guild.emojis.resolve(FoundEmoji.id) 
    client.db.databaseUtils.setCache(cacheId,emoji.toString(),{EX:(60*60)*12})
    // await client.db.redis.set(cacheId, emoji.toString(), {EX: 60*60*12})
    return emoji
                
}

module.exports = emojiFetch