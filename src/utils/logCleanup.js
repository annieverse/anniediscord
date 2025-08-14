const fs = require(`fs`)
const path = require(`path`)

/**
 * Removes log files older than the specified number of days
 * @param {string} logsDir - Path to the logs directory
 * @param {number} maxAgeInDays - Maximum age of log files in days (default: 7)
 * @returns {Promise<object>} Cleanup result with count of removed files
 */
async function cleanupOldLogs(logsDir = path.join(process.cwd(), `.logs`), maxAgeInDays = 7) {
    const result = {
        success: false,
        removedFiles: [],
        error: null
    }

    try {
        if (!fs.existsSync(logsDir)) {
            result.success = true
            result.message = `Logs directory does not exist: ${logsDir}`
            return result
        }

        const files = fs.readdirSync(logsDir)
        const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds
        const now = Date.now()

        for (const file of files) {
            const filePath = path.join(logsDir, file)
            const stats = fs.statSync(filePath)

            // Only process .log files
            if (stats.isFile() && path.extname(file) === `.log`) {
                const fileAge = now - stats.mtime.getTime()
                
                if (fileAge > maxAgeMs) {
                    fs.unlinkSync(filePath)
                    result.removedFiles.push(file)
                }
            }
        }

        result.success = true
        result.message = `Cleanup completed. Removed ${result.removedFiles.length} old log files.`
    } catch (error) {
        result.error = error.message
        result.message = `Cleanup failed: ${error.message}`
    }

    return result
}

/**
 * Sets up automatic log cleanup using a cron job
 * @param {object} cronManager - CronManager instance from the main application
 * @param {string} [schedule='0 2 * * *'] - Cron schedule (default: daily at 2 AM)
 * @param {number} [maxAgeInDays=7] - Maximum age of log files in days
 */
function setupLogCleanupCron(cronManager, schedule = `0 2 * * *`, maxAgeInDays = 7) {
    if (!cronManager) {
        throw new Error(`CronManager instance is required for automatic log cleanup`)
    }

    cronManager.add(`log-cleanup`, schedule, async () => {
        const result = await cleanupOldLogs(undefined, maxAgeInDays)
        
        // Log the cleanup result
        const { masterLogger } = require(`../pino.config.js`)
        const { createStandardLog } = require(`./standardLogger`)
        
        if (result.success) {
            masterLogger.info(createStandardLog(`log_cleanup_completed`, {
                context: {
                    removedFiles: result.removedFiles,
                    message: result.message
                }
            }))
        } else {
            masterLogger.error(createStandardLog(`log_cleanup_failed`, {
                context: {
                    error: result.error,
                    message: result.message
                }
            }))
        }
    })

    cronManager.start(`log-cleanup`)
}

module.exports = { cleanupOldLogs, setupLogCleanupCron }