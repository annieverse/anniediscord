const { expect } = require(`chai`)
const fs = require(`fs`)
const path = require(`path`)
const { cleanupOldLogs } = require(`../../src/utils/logRotation`)

describe(`logRotation`, () => {
    const testLogsDir = `/tmp/test-logs`
    
    beforeEach(() => {
        // Create test directory
        if (!fs.existsSync(testLogsDir)) {
            fs.mkdirSync(testLogsDir, { recursive: true })
        }
    })

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testLogsDir)) {
            const files = fs.readdirSync(testLogsDir)
            files.forEach(file => {
                fs.unlinkSync(path.join(testLogsDir, file))
            })
            fs.rmdirSync(testLogsDir)
        }
    })

    describe(`cleanupOldLogs`, () => {
        it(`should not fail when logs directory does not exist`, () => {
            expect(() => {
                cleanupOldLogs(`/tmp/non-existent-logs`)
            }).to.not.throw()
        })

        it(`should remove files older than specified days`, () => {
            const oldFile = path.join(testLogsDir, `old.log`)
            const newFile = path.join(testLogsDir, `new.log`)
            
            // Create files
            fs.writeFileSync(oldFile, `old log content`)
            fs.writeFileSync(newFile, `new log content`)
            
            // Make old file appear older by modifying its mtime
            const oldTime = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)) // 8 days ago
            fs.utimesSync(oldFile, oldTime, oldTime)
            
            // Run cleanup with 7 day threshold
            cleanupOldLogs(testLogsDir, 7)
            
            // Check results
            expect(fs.existsSync(oldFile)).to.be.false
            expect(fs.existsSync(newFile)).to.be.true
        })

        it(`should keep files newer than specified days`, () => {
            const recentFile = path.join(testLogsDir, `recent.log`)
            
            // Create recent file
            fs.writeFileSync(recentFile, `recent log content`)
            
            // Run cleanup with 7 day threshold
            cleanupOldLogs(testLogsDir, 7)
            
            // File should still exist
            expect(fs.existsSync(recentFile)).to.be.true
        })

        it(`should call logger function when provided`, () => {
            const logMessages = []
            const mockLogger = {
                info: (msg) => logMessages.push(`INFO: ${msg}`),
                error: (msg) => logMessages.push(`ERROR: ${msg}`)
            }

            const oldFile = path.join(testLogsDir, `old.log`)
            fs.writeFileSync(oldFile, `old content`)
            
            // Make file old
            const oldTime = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000))
            fs.utimesSync(oldFile, oldTime, oldTime)
            
            cleanupOldLogs(testLogsDir, 7, mockLogger)
            
            expect(logMessages).to.have.lengthOf(1)
            expect(logMessages[0]).to.include(`INFO: Cleaned up old log file: old.log`)
        })
    })
})