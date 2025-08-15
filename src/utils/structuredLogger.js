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
 * Wraps legacy log messages into the new structured format
 * @param {string} action - The action being performed
 * @param {*} legacyMessage - The original log message/data
 * @param {Object} [additionalOptions] - Additional structured log options
 * @returns {Object} Structured log entry with legacy data in context
 */
function wrapLegacyLog(action, legacyMessage, additionalOptions = {}) {
    return createStructuredLog({
        action,
        context: legacyMessage,
        ...additionalOptions
    })
}

module.exports = { createStructuredLog, wrapLegacyLog }