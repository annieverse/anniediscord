const levelZeroErrors = require(`../utils/errorLevels.js`)
module.exports = function DiscordError(client, e) {
    // if (!client.dev) return // Should return any errors to support server if they arnt caught by other handlers
    //  Report to support server
    client.shard.broadcastEval(formatedErrorLog, { context: { error_message: e.message, levelZeroErrors: levelZeroErrors } })
    function formatedErrorLog(c, { error_message, levelZeroErrors }) {
        const date = new Date()
        const lvl0Test = levelZeroErrors.includes(error_message)
        const lvl0ChanCacheTest = !c.channels.cache.has(`797521371889532988`)
        const lvl1ChanCacheTest = !c.channels.cache.has(`848425166295269396`)
        const ERROR_MESSAGE = { content: `─────────────────☆～:;\n**Discord Error event**\n**TIMESTAMP:** ${date}\n**LOCAL_TIME:** <t:${Math.floor(date.getTime() / 1000)}:F>\n**ISSUE_TRACE:** ${error_message}\n─────────────────☆～:;` }
        lvl0Test ? lvl1ChanCacheTest ? c.channels.fetch(`848425166295269396`).then(channel => channel.send(ERROR_MESSAGE)) : c.channels.cache.get(`848425166295269396`).send(ERROR_MESSAGE) : lvl0ChanCacheTest ? c.channels.fetch(`797521371889532988`).then(channel => channel.send(ERROR_MESSAGE)) : c.channels.cache.get(`797521371889532988`).send(ERROR_MESSAGE)
        return
    }
    return client.logger.error(`Ops, something went wrong > ${e}\n${e.stack}`)
}
