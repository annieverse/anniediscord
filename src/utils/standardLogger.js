const { v4: uuidv4 } = require(`uuid`)

/**
 * Creates a standardized log entry with required and optional fields
 * @param {string} action - The action being performed (e.g., 'setshop_register_successful')
 * @param {object} options - Optional fields
 * @param {string} [options.requestId] - Unique identifier for the request flow (auto-generated if not provided)
 * @param {string} [options.userId] - Discord user ID
 * @param {string} [options.guildId] - Discord guild ID
 * @param {string} [options.channelId] - Discord channel ID
 * @param {string} [options.shardId] - Shard identifier (e.g., 'SHARD_ID:0/CAKE')
 * @param {any} [options.context] - Additional context data (legacy logs, error messages, etc.)
 * @returns {object} Standardized log object
 */
function createStandardLog(action, options = {}) {
    const {
        requestId = uuidv4(),
        userId,
        guildId,
        channelId,
        shardId,
        context
    } = options

    const logEntry = {
        requestId,
        action
    }

    // Add optional fields only if they exist
    if (userId) logEntry.userId = userId
    if (guildId) logEntry.guildId = guildId
    if (channelId) logEntry.channelId = channelId
    if (shardId) logEntry.shardId = shardId
    if (context !== undefined) logEntry.context = context

    return logEntry
}

/**
 * Creates a logger wrapper that automatically includes shard information
 * @param {object} logger - Pino logger instance
 * @param {string} shardId - Shard identifier
 * @returns {object} Enhanced logger with standardized methods
 */
function createShardLogger(logger, shardId) {
    return {
        info: (action, options = {}) => {
            const logData = createStandardLog(action, { ...options, shardId })
            logger.info(logData)
        },
        warn: (action, options = {}) => {
            const logData = createStandardLog(action, { ...options, shardId })
            logger.warn(logData)
        },
        error: (action, options = {}) => {
            const logData = createStandardLog(action, { ...options, shardId })
            logger.error(logData)
        },
        debug: (action, options = {}) => {
            const logData = createStandardLog(action, { ...options, shardId })
            logger.debug(logData)
        },
        // Provide access to original logger for legacy compatibility
        _original: logger
    }
}

module.exports = { createStandardLog, createShardLogger }