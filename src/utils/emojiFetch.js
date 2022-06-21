const Discord = require(`discord.js`)

/**
 *  Fetching emojis across all shards.
 *  @param {string} emojiKeyword emoji's ID/Snowflake/Name
 *  @param {object} client Current client instance
 *  @return {string|Discord.Emoji} 
 */
const emojiFetch = async (emojiKeyword, client) => {
    const cacheId = `EMOJI_CACHE_${emojiKeyword}`
    //  Check on own client first.
    const onCache = await client.db.redis.get(cacheId)
    if (onCache) {
        //  Use cache for faster response
        return onCache
    }
    function findEmoji(c, { nameOrId }) {
        return c.emojis.cache.get(nameOrId) || c.emojis.cache.find(e => e.name.toLowerCase() === nameOrId.toLowerCase());
    }
    const findingEmoji = await client.shard.broadcastEval(findEmoji, { context: { nameOrId: emojiKeyword } })
    const emoji = client.guilds.cache.get(findingEmoji[0].guildId).emojis.resolve(findingEmoji[0].id)
    await client.db.redis.set(cacheId, emoji.toString(), `EX`, 60*60*12)
    return emoji
                
}

module.exports = emojiFetch



