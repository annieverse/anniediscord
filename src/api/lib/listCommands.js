"use strict"
const fs = require(`fs`)
const path = require(`path`)

/**
 * Keys to strip from each command's metadata before serializing. The user-facing
 * goal is "drop function metadata"; in practice that means the dispatch entry
 * points (execute/Iexecute/run). Helper functions sitting as top-level keys
 * (e.g. pixiv's `getImage`) are also methods and would normally serialize as
 * `{}` via JSON, but we still want to omit them so consumers don't get noisy
 * empty objects in the response. We do that generically by filtering out any
 * top-level value whose typeof is `function`.
 */
const FORCED_OMIT = new Set([`execute`, `Iexecute`, `run`])

/**
 * Walk the on-disk command directory and return a `{ filename: metadata }`
 * map. The key is the file basename without the `.js` extension (matches the
 * way the bot itself addresses files), which is *not* always the same as
 * `module.name` — e.g. `sellFragments.js` exports `name: 'sellfragments'`.
 *
 * Skips:
 *   - non-`.js` files
 *   - the deprecated structure (commands that export a `help` key — same
 *     gate the loader uses, so the API mirrors what actually ships)
 *   - top-level function values (entry points like execute/Iexecute/run plus
 *     any helper methods on the module)
 *
 * @param {string} commandsDir Absolute path to `src/commands`.
 * @return {object} `{ [fileBasename]: metadata }`
 */
function listCommands(commandsDir) {
    const result = {}
    const groups = fs.readdirSync(commandsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)

    for (const group of groups) {
        const groupDir = path.join(commandsDir, group)
        const files = fs.readdirSync(groupDir).filter(f => f.endsWith(`.js`))
        for (const file of files) {
            const filePath = path.join(groupDir, file)
            //  Use require to mirror the bot's loader; commands are CommonJS
            //  modules with a single object export.
            // eslint-disable-next-line global-require
            const src = require(filePath)
            if (!src || typeof src !== `object`) continue
            //  Mirror the loader's deprecation gate.
            if (Object.prototype.hasOwnProperty.call(src, `help`)) continue
            const metadata = {}
            for (const key of Object.keys(src)) {
                if (FORCED_OMIT.has(key)) continue
                if (typeof src[key] === `function`) continue
                metadata[key] = src[key]
            }
            //  Tag with the group folder for parity with what `loader.js` does
            //  to live commands at runtime (`src.group = dir`). Consumers
            //  reading this endpoint expect the same shape.
            metadata.group = group
            const basename = file.replace(/\.js$/, ``)
            result[basename] = metadata
        }
    }
    return result
}

module.exports = { listCommands }
