const Discord = require(`discord.js`)
/**
 * Fetch global emojis through shard broadcast eval
 * @param {string} keyword
 * @return {object}
 */
const broadcastScript = (keyword) => {	
    const temp = this.emojis.cache.get(keyword) || this.emojis.cache.find(e => e.name === keyword)
    if (!temp) return null
    // Clone the object because it is modified right after, so as to not affect the cache in client.emojis
    const emoji = Object.assign({}, temp)
    // Circular references can't be returned outside of eval, so change it to the id
    if (emoji.guild) emoji.guild = emoji.guild.id
    // A new object will be constructed, so simulate raw data by adding this property back
    emoji.require_colons = emoji.requiresColons
    return emoji
}

/**
 *  Fetching emojis across all shards.
 *  @param {string} emojiKeyword emoji's ID/Snowflake/Name
 *  @param {object} client Current client instance
 *  @return {string|Discord.Emoji} 
 */
const emojiFetch = async (emojiKeyword, client) => {
    //  Check on own client first.
    const onCache = client.emojis.cache.get(emojiKeyword) || client.emojis.cache.find(e => e.name === emojiKeyword)
    if (onCache) {
        //  Use cache for faster response
        return onCache
    }
    const runScript = await client.shard.broadcastEval(`(${broadcastScript}).call(this, '${emojiKeyword}')`)
    const findEmoji = runScript.find(e => e)
    if (!findEmoji) return `(???)`
    const raw = await client.api.guilds(findEmoji.guild).get()
    const guild = new Discord.Guild(client, raw)
    const emoji = new Discord.GuildEmoji(client, findEmoji, guild)
    //  Store on cache
    client.emojis.cache.set(emoji.id, emoji)
    return emoji
}

module.exports = emojiFetch



