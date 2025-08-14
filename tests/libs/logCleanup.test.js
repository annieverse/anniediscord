const { expect } = require(`chai`)
const fs = require(`fs`)
const path = require(`path`)
const { cleanupOldLogs } = require(`../../src/utils/logCleanup`)

describe(`Log Cleanup System`, () => {
    const testLogsDir = path.join(__dirname, `../../.logs-test`)
    
    beforeEach(() => {
        // Create test logs directory
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
        it(`should handle non-existent logs directory gracefully`, async () => {
            const nonExistentDir = path.join(__dirname, `../../.logs-nonexistent`)
            const result = await cleanupOldLogs(nonExistentDir)
            
            expect(result.success).to.be.true
            expect(result.removedFiles).to.be.an(`array`).that.is.empty
            expect(result.message).to.include(`does not exist`)
        })

        it(`should not remove recent log files`, async () => {
            // Create a recent log file
            const recentLogFile = path.join(testLogsDir, `recent.log`)
            fs.writeFileSync(recentLogFile, `test log content`)
            
            const result = await cleanupOldLogs(testLogsDir, 7)
            
            expect(result.success).to.be.true
            expect(result.removedFiles).to.be.an(`array`).that.is.empty
            expect(fs.existsSync(recentLogFile)).to.be.true
        })

        it(`should remove old log files`, async () => {
            // Create an old log file by modifying its mtime
            const oldLogFile = path.join(testLogsDir, `old.log`)
            fs.writeFileSync(oldLogFile, `old log content`)
            
            // Set file modified time to 8 days ago
            const eightDaysAgo = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000))
            fs.utimesSync(oldLogFile, eightDaysAgo, eightDaysAgo)
            
            const result = await cleanupOldLogs(testLogsDir, 7)
            
            expect(result.success).to.be.true
            expect(result.removedFiles).to.include(`old.log`)
            expect(fs.existsSync(oldLogFile)).to.be.false
        })

        it(`should only process .log files`, async () => {
            // Create various files
            const logFile = path.join(testLogsDir, `test.log`)
            const txtFile = path.join(testLogsDir, `test.txt`)
            const noExtFile = path.join(testLogsDir, `test`)
            
            fs.writeFileSync(logFile, `log content`)
            fs.writeFileSync(txtFile, `txt content`)
            fs.writeFileSync(noExtFile, `no ext content`)
            
            // Set all files to be old
            const eightDaysAgo = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000))
            fs.utimesSync(logFile, eightDaysAgo, eightDaysAgo)
            fs.utimesSync(txtFile, eightDaysAgo, eightDaysAgo)
            fs.utimesSync(noExtFile, eightDaysAgo, eightDaysAgo)
            
            const result = await cleanupOldLogs(testLogsDir, 7)
            
            expect(result.success).to.be.true
            expect(result.removedFiles).to.include(`test.log`)
            expect(result.removedFiles).to.not.include(`test.txt`)
            expect(result.removedFiles).to.not.include(`test`)
            
            expect(fs.existsSync(logFile)).to.be.false
            expect(fs.existsSync(txtFile)).to.be.true
            expect(fs.existsSync(noExtFile)).to.be.true
        })
    })
})