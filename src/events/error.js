const levelZeroErrors = require(`../utils/errorLevels.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const { WebhookClient } = require(`discord.js`)
const wh = process.env.ERROR_WEBHOOK_URL ? new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL }) : null
module.exports = function error(client, e) {
    if (!client.isReady()) return
    // if (!client.dev) return // Should return any errors to support server if they arnt caught by other handlers
    //  Report to support server
    client.logger.error(`Ops, something went wrong > ${e}\n${e.stack}`)
    errorRelay(client, { fileName: `error.js`, errorType: `normal`, error_message: e.message, error_stack: e.stack, levelZeroErrors: levelZeroErrors }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    // client.shard.broadcastEval(errorRelay, { context: { fileName: `error.js`, errorType: `normal`,error_message: e.message, error_stack: e.stack, levelZeroErrors:levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`)) 
    //  When dev err wh is available
    if (wh) {
        wh.send({
            content: `**${new Date()}**\n\`\`\`js\n${e.message}\n${e.stack}\n\`\`\``,
            username: `Dev Error(s)`,
            threadId: `1395552222405988362`
        })
    }
}
