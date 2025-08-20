const { v4: uuidv4 } = require(`uuid`)

/**
 * Creates a structured log entry with standardized properties
 * @param {Object} options - Log entry options
 * @param {string} options.action - The action being performed (snake_case)
 * @param {string} [options.userId] - Discord user ID
 * @param {string} [options.guildId] - Discord guild ID
 * @param {string} [options.channelId] - Discord channel ID
 * @param {string} [options.shardId] - Shard identifier
 * @param {*} [options.context] - Additional context data (legacy logs, error messages, etc.)
 * @param {string} [options.requestId] - Optional custom request ID, will generate if not provided
 * @returns {Object} Structured log entry
 */
function createStructuredLog(options) {
    const {
        action,
        userId,
        guildId,
        channelId,
        shardId,
        context,
        requestId = uuidv4()
    } = options

    const logEntry = {
        requestId,
        action,
        timestamp: new Date().toISOString()
    }

    // Add optional properties only if they have values
    if (userId) logEntry.userId = userId
    if (guildId) logEntry.guildId = guildId
    if (channelId) logEntry.channelId = channelId
    if (shardId) logEntry.shardId = shardId
    if (context !== undefined) logEntry.context = context

    return logEntry
}

/**
 * Validates that a log object has the required properties for structured logging
 * @param {Object} logObj - The log object to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateStructuredLog(logObj) {
    if (typeof logObj !== `object` || logObj === null) {
        throw new Error(`Log object must be a valid object`)
    }
    
    if (!logObj.action || typeof logObj.action !== `string`) {
        throw new Error(`Log object must have a valid "action" property (string)`)
    }
    
    if (!logObj.requestId || typeof logObj.requestId !== `string`) {
        throw new Error(`Log object must have a valid "requestId" property (string)`)
    }
    
    if (!logObj.timestamp || typeof logObj.timestamp !== `string`) {
        throw new Error(`Log object must have a valid "timestamp" property (string)`)
    }
    
    return true
}

module.exports = { createStructuredLog, validateStructuredLog }