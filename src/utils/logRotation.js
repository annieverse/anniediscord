const fs = require(`fs`)
const path = require(`path`)

/**
 * Cleans up log files older than the specified number of days
 * @param {string} logsDirectory - Path to logs directory
 * @param {number} maxAgeDays - Maximum age in days (default: 7)
 * @param {Function} [logger] - Optional logger function for notifications
 */
function cleanupOldLogs(logsDirectory = `./.logs`, maxAgeDays = 7, logger = null) {
    try {
        if (!fs.existsSync(logsDirectory)) {
            return
        }

        const files = fs.readdirSync(logsDirectory)
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
        const now = Date.now()

        files.forEach(file => {
            const filePath = path.join(logsDirectory, file)
            const stats = fs.statSync(filePath)
            
            if (stats.isFile() && (now - stats.mtime.getTime()) > maxAgeMs) {
                fs.unlinkSync(filePath)
                if (logger) {
                    logger.info(`Cleaned up old log file: ${file}`)
                }
            }
        })
    } catch (error) {
        if (logger) {
            logger.error(`Error cleaning up old logs: ${error.message}`)
        }
    }
}

/**
 * Schedules periodic log cleanup using a simple interval
 * @param {number} intervalHours - Cleanup interval in hours (default: 24)
 * @param {string} logsDirectory - Path to logs directory
 * @param {number} maxAgeDays - Maximum age in days
 * @param {Function} [logger] - Optional logger function for notifications
 */
function scheduleLogCleanup(intervalHours = 24, logsDirectory = `./.logs`, maxAgeDays = 7, logger = null) {
    const intervalMs = intervalHours * 60 * 60 * 1000
    
    // Run cleanup immediately
    cleanupOldLogs(logsDirectory, maxAgeDays, logger)
    
    // Schedule periodic cleanup
    setInterval(() => {
        cleanupOldLogs(logsDirectory, maxAgeDays, logger)
    }, intervalMs)
}

module.exports = { cleanupOldLogs, scheduleLogCleanup }