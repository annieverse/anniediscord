/**
* Reset redis cache for specific user incase of error
* @return {void}
*/
const cacheReset = async (client, cmdName, memberId, guildId) => {
    let sessionId = null
    switch (cmdName) {
        case `makereward`:
            sessionId = `REWARD_REGISTER:${memberId}@${guildId}`
            break
        case `setshop`:
            sessionId = `SHOP_REGISTER:${memberId}@${guildId}`
            break
        case `cartcoin`:
            sessionId = `CARTCOIN:${memberId}@${guildId}`
            break
        case `gacha`:
            sessionId = `GACHA_SESSION:${memberId}@${guildId}`
            break
        case `quests`:
            sessionId = `QUEST_SESSION:${memberId}@${guildId}`
            break
        default:
            break
    }

    // Command specific cache
    if (sessionId != null && await client.db.databaseUtils.doesCacheExist(sessionId)) client.db.databaseUtils.delCache(sessionId)
    // Secondary cache from confirmator
    sessionId = `CONFIRMATOR:${memberId}_${guildId}`
    if (await client.db.databaseUtils.doesCacheExist(sessionId)) client.db.databaseUtils.delCache(sessionId)
}
module.exports = cacheReset