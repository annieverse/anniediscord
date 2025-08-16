const e = require("express")
const errorRelay = require("../../utils/errorHandler")

module.exports = function shardError(annie, error, shardId) {
    annie.logger.error(`Shard ${shardId} encountered an error:`, error)
    const errorMessage = error.message || "An unknown error occurred"
    const errorStack = error.stack || "No stack trace available"
    errorRelay(annie, { fileName: `shardError.js`, errorType: `normal`, error_message: errorMessage, error_stack: errorStack }).catch(err => annie.logger.error(`Unable to send message to channel > ${err}`))
}