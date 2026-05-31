"use strict"
const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)
const path = require(`path`)
const fs = require(`fs`)
const os = require(`os`)

const { listCommands } = require(`../../src/api/lib/listCommands`)
const v1Router = require(`../../src/api/routes/v1`)

/**
 * Build a real on-disk command tree under a temp directory so we are testing
 * the walker, not a mock of it. Each fixture file mirrors the production
 * shape — a CommonJS module exporting an object with a name, dispatch
 * functions, and metadata.
 */
function buildFixtureTree() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `annie-cmds-`))
    const userDir = path.join(root, `user`)
    const settingDir = path.join(root, `setting`)
    fs.mkdirSync(userDir)
    fs.mkdirSync(settingDir)

    fs.writeFileSync(path.join(userDir, `pay.js`), `
        "use strict"
        module.exports = {
            name: \`pay\`,
            aliases: [\`transfer\`],
            description: \`Share artcoins\`,
            usage: \`pay <user> <amount>\`,
            permissionLevel: 0,
            applicationCommand: true,
            messageCommand: true,
            options: [{ name: \`user\`, required: true }],
            tax: 0.02,
            execute() {},
            Iexecute() {},
            run() {},
            //  Helper method on the module — should also be filtered out.
            userCheck() { return true }
        }
    `)

    //  File whose basename diverges from its declared name. The endpoint
    //  must key by file basename, not by `name`.
    fs.writeFileSync(path.join(userDir, `sellFragments.js`), `
        "use strict"
        module.exports = {
            name: \`sellfragments\`,
            description: \`Sell fragments\`,
            applicationCommand: true,
            messageCommand: true,
            execute() {}
        }
    `)

    //  Deprecated structure (exports a \`help\` key) — must be skipped to
    //  match the loader's behavior.
    fs.writeFileSync(path.join(settingDir, `legacy.js`), `
        "use strict"
        module.exports = {
            name: \`legacy\`,
            help: { description: \`old-style command\` },
            execute() {}
        }
    `)

    //  Non-js file in a category — must be ignored.
    fs.writeFileSync(path.join(settingDir, `README.md`), `not a command`)

    return root
}

describe(`api/v1 listCommands`, () => {
    it(`keys results by file basename without the extension`, () => {
        const root = buildFixtureTree()
        const commands = listCommands(root)
        expect(Object.keys(commands).sort()).to.deep.equal([`pay`, `sellFragments`])
        //  `sellFragments` has `name: 'sellfragments'` but the key is the
        //  file basename, not the declared name.
        expect(commands.sellFragments.name).to.equal(`sellfragments`)
    })

    it(`omits execute, Iexecute, run, and any helper methods`, () => {
        const root = buildFixtureTree()
        const { pay } = listCommands(root)
        expect(pay).to.not.have.property(`execute`)
        expect(pay).to.not.have.property(`Iexecute`)
        expect(pay).to.not.have.property(`run`)
        expect(pay).to.not.have.property(`userCheck`)
    })

    it(`preserves non-function metadata as declared`, () => {
        const root = buildFixtureTree()
        const { pay } = listCommands(root)
        expect(pay.name).to.equal(`pay`)
        expect(pay.aliases).to.deep.equal([`transfer`])
        expect(pay.description).to.equal(`Share artcoins`)
        expect(pay.usage).to.equal(`pay <user> <amount>`)
        expect(pay.permissionLevel).to.equal(0)
        expect(pay.applicationCommand).to.equal(true)
        expect(pay.messageCommand).to.equal(true)
        expect(pay.options).to.deep.equal([{ name: `user`, required: true }])
        expect(pay.tax).to.equal(0.02)
    })

    it(`tags every command with its directory as group`, () => {
        const root = buildFixtureTree()
        const { pay, sellFragments } = listCommands(root)
        expect(pay.group).to.equal(`user`)
        expect(sellFragments.group).to.equal(`user`)
    })

    it(`skips deprecated commands and non-js files`, () => {
        const root = buildFixtureTree()
        const commands = listCommands(root)
        expect(commands).to.not.have.property(`legacy`)
        //  The README.md sat next to legacy.js — neither should appear.
        expect(Object.keys(commands)).to.have.lengthOf(2)
    })
})

/**
 * Build a stub Express request/response pair. Mirrors how the existing
 * suites probe handlers without supertest, since the project doesn't carry
 * an HTTP-client dep.
 */
function stubReqRes(headers = {}) {
    let statusCode = 0
    let body = null
    return {
        req: { get: (key) => headers[key.toLowerCase()] || null },
        res: {
            status(code) { statusCode = code; return this },
            json(payload) { body = payload; return this }
        },
        snapshot: () => ({ statusCode, body })
    }
}

describe(`api/v1 GET /commands`, () => {
    it(`returns the live command tree from src/commands keyed by basename`, () => {
        //  Drive the route function directly. v1Router returns an Express
        //  Router; we reach into its stack to pull the /commands handler so
        //  we don't need to spin up an HTTP server in the test.
        const logger = { debug() {}, error() {}, warn() {}, info() {} }
        const router = v1Router({ logger, basePath: `/api` })
        const layer = router.stack.find(l => l.route && l.route.path === `/commands`)
        expect(layer, `expected /commands route to be registered`).to.exist
        const handler = layer.route.stack[0].handle
        const { req, res, snapshot } = stubReqRes()
        handler(req, res)
        const { statusCode, body } = snapshot()
        expect(statusCode).to.equal(200)
        expect(body.ok).to.equal(true)
        expect(body).to.have.property(`commands`)
        expect(body.count).to.equal(Object.keys(body.commands).length)
        //  Spot-check one command we know exists in production. `pay.js` is
        //  the canonical reference for the spend pattern, so its filename
        //  should always resolve.
        expect(body.commands).to.have.property(`pay`)
        const pay = body.commands.pay
        expect(pay).to.not.have.property(`execute`)
        expect(pay).to.not.have.property(`Iexecute`)
        expect(pay).to.not.have.property(`run`)
        expect(pay.name).to.equal(`pay`)
        expect(pay.group).to.equal(`user`)
    })

    it(`responds with 500 when the commands directory cannot be read`, () => {
        //  Patch listCommands' parent module by re-requiring v1 with a stub
        //  for fs is heavier than warranted — instead, point the route at a
        //  non-existent dir by monkey-patching path.resolve briefly.
        const realResolve = path.resolve
        path.resolve = function patched(...parts) {
            //  Only redirect the call that builds the commandsDir; leave
            //  everything else intact.
            const joined = realResolve(...parts)
            if (joined.endsWith(`commands`)) return realResolve(os.tmpdir(), `does-not-exist-` + Date.now())
            return joined
        }
        try {
            const logger = { debug() {}, error() {}, warn() {}, info() {} }
            const router = v1Router({ logger, basePath: `/api` })
            const layer = router.stack.find(l => l.route && l.route.path === `/commands`)
            const handler = layer.route.stack[0].handle
            const { req, res, snapshot } = stubReqRes()
            handler(req, res)
            const { statusCode, body } = snapshot()
            expect(statusCode).to.equal(500)
            expect(body).to.deep.equal({ ok: false, error: `commands_listing_failed` })
        } finally {
            path.resolve = realResolve
        }
    })
})
