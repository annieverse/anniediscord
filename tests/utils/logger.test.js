"use strict"

const { expect } = require(`chai`)
const fs = require(`fs`)
const os = require(`os`)
const path = require(`path`)

/**
 * Purge a module (and optionally its children) from the Node.js require cache.
 * @param {string} modulePath absolute resolved path
 */
const purgeModule = (modulePath) => {
    const cached = require.cache[modulePath]
    if (!cached) return
    // Remove children first to avoid lingering references
    for (const child of cached.children) purgeModule(child.id)
    delete require.cache[modulePath]
}

/**
 * Load a fresh logger instance with a clean cache & provided env overrides.
 * @param {object} env key-value pairs to assign to process.env
 * @returns {import('pino').Logger}
 */
const freshLogger = (env = {}) => {
    // Reset only relevant env keys first
    for (const key of [`STREAM_LOG_TO_FILE`, `LOG_LEVEL`, `NODE_ENV`]) {
        delete process.env[key]
    }
    Object.assign(process.env, env)
    const loggerPath = require.resolve(`../../pino.config`)
    purgeModule(loggerPath)
    return require(loggerPath)
}

describe(`Logger`, () => {
    let originalCwd
    let tempDir
    const dateStamp = new Date().toLocaleDateString(`en-GB`, {
        day: `2-digit`, month: `2-digit`, year: `numeric`
    }).replace(/\//g, `-`)

    beforeEach(() => {
        originalCwd = process.cwd()
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `test-`))
        process.chdir(tempDir)
    })

    afterEach(() => {
        process.chdir(originalCwd)
        try {
            fs.rmSync(tempDir, { recursive: true, force: true })
        } catch (_) {}
    })

    it(`writes JSON log file with level label (not number)`, async () => {
        const logger = freshLogger({
            STREAM_LOG_TO_FILE: `1`,
            NODE_ENV: `production`,
            LOG_LEVEL: `info`
        })
        logger.info({ action: `test_log_write`, sample: true })
        if (typeof logger.flush === `function`) logger.flush()
        await new Promise(r => setTimeout(r, 80))
        const filePath = path.join(tempDir, `logs`, `${dateStamp}.json`)
        expect(fs.existsSync(filePath)).to.equal(true)
        const lines = fs.readFileSync(filePath, `utf8`).trim().split(/\n+/)
        expect(lines.length).to.be.greaterThan(0)
        const parsed = JSON.parse(lines.pop())
        expect(parsed.level).to.equal(`info`)
        expect(parsed.action).to.equal(`test_log_write`)
    })

    it(`respects LOG_LEVEL filtering (only error when LOG_LEVEL=error)`, async () => {
        const logger = freshLogger({
            STREAM_LOG_TO_FILE: `1`,
            NODE_ENV: `production`,
            LOG_LEVEL: `error`
        })
        logger.debug({ action: `debug_should_be_filtered` })
        logger.info({ action: `info_should_be_filtered` })
        logger.error({ action: `error_should_pass` })
        if (typeof logger.flush === `function`) logger.flush()
        await new Promise(r => setTimeout(r, 80))
        const filePath = path.join(tempDir, `logs`, `${dateStamp}.json`)
        const raw = fs.readFileSync(filePath, `utf8`).trim().split(/\n+/)
        expect(raw.length).to.equal(1)
        const parsed = JSON.parse(raw[0])
        expect(parsed.level).to.equal(`error`)
        expect(parsed.action).to.equal(`error_should_pass`)
    })

    it(`creates fresh instance (no cached config carry-over)`, async () => {
        // First run with error level
        const loggerA = freshLogger({
            STREAM_LOG_TO_FILE: `1`,
            NODE_ENV: `production`,
            LOG_LEVEL: `error`
        })
        loggerA.info({ action: `should_not_log_a` })
        loggerA.error({ action: `logged_error_a` })
        if (typeof loggerA.flush === `function`) loggerA.flush()
        await new Promise(r => setTimeout(r, 60))

        // Second run with debug level should now log debug
        const loggerB = freshLogger({
            STREAM_LOG_TO_FILE: `1`,
            NODE_ENV: `production`,
            LOG_LEVEL: `debug`
        })
        loggerB.debug({ action: `debug_should_log_b` })
        if (typeof loggerB.flush === `function`) loggerB.flush()
        await new Promise(r => setTimeout(r, 60))

        const filePath = path.join(tempDir, `logs`, `${dateStamp}.json`)
        const lines = fs.readFileSync(filePath, `utf8`).trim().split(/\n+/)
        // Expect 2 lines: one error from first instance + one debug from second
        expect(lines.length).to.equal(2)
        const parsedLast = JSON.parse(lines.pop())
        expect(parsedLast.level).to.equal(`debug`)
        expect(parsedLast.action).to.equal(`debug_should_log_b`)
    })
})