"use strict"
const errorRelay = require(`../utils/errorHandler.js`)
const { WebhookClient } = require(`discord.js`)
const wh = process.env.ERROR_WEBHOOK_URL ? new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL }) : null
module.exports = function error(client, e) {
    if (!client.isReady()) return
    
    // Handle WebSocket handshake timeout errors specifically
    if (e.message && e.message.includes(`handshake has timed out`)) {
        client.logger.warn(`WebSocket handshake timeout error intercepted in error handler`)
        client.logger.error(`WebSocket timeout details: ${e.message}`)
        // Don't send this to error relay as it's a known networking issue
        // that should be handled by retry logic
        return
    }
    
    // if (!client.dev) return // Should return any errors to support server if they arnt caught by other handlers
    //  Report to support server
    client.logger.error(`Ops, something went wrong > ${e}\n${e.stack}`)
    const errorStack = e.stack || `Unknown Error Stack`
    const errorMsg = e.message || `Unknown Error`
    errorRelay(client, { fileName: `error.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    //  When dev err wh is available
    if (wh) {
        // Don't send WebSocket timeout errors to webhook
        if (!(e.message && e.message.includes(`handshake has timed out`))) {
            wh.send({
                content: `**${new Date()}**\n\`\`\`js\n${e.message}\n${e.stack}\n\`\`\``,
                username: `Dev Error(s)`,
                threadId: `1395552222405988362`
            })
        }
    }
}
