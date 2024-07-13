const levelZeroErrors = require(`../utils/errorLevels.js`)
const errorRelay = require(`../utils/errorHandler.js`)
module.exports = function error(client, e) {
    if (!client.isReady()) return
    // if (!client.dev) return // Should return any errors to support server if they arnt caught by other handlers
    //  Report to support server
    client.logger.error(`Ops, something went wrong > ${e}\n${e.stack}`)
    client.shard.broadcastEval(errorRelay, { context: { fileName: `error.js`, errorType: `normal`,error_message: e.message, error_stack: e.stack, levelZeroErrors:levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`)) 
}
