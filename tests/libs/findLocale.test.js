"use strict"
const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)

const { Localization } = require(`../../src/libs/localizer`)

/**
 * #4 — `findLocale` used to read singleton `this.#lang` on every call. Two
 * concurrent users with different locales (request A in `fr`, request B in
 * `en`) interleaving across an `await` could see each other's strings,
 * because A's controller mutated the singleton, then B's controller mutated
 * it back, then A's post-await `locale(...)` call resolved against B's lang.
 *
 * After the fix, `findLocale(key, lang)` takes the lang from the closure
 * captured at controller entry. The singleton setter still exists for the
 * one path that has no per-request user (annie.js buff-expiration DM), but
 * is no longer load-bearing for command flows.
 *
 * These tests assert the post-fix shape and re-create the race that the
 * pre-fix singleton would have lost. They probe the constructed Localization
 * for keys at runtime instead of reading the JSON files directly so they
 * stay correct under both real-locale and mocked-locale pools (the existing
 * `tests/libs/localizer.js` patches `Module.prototype.require` permanently
 * once it loads, so a sibling test cannot assume the real files are in scope).
 */
describe(`Localization.findLocale`, () => {

    /**
     * Find a locale key whose en/fr values both resolve and differ. Use the
     * singleton setter to probe — that path is independent of the new
     * lang-argument path we are testing — and only check keys that don't
     * fall back to the placeholder.
     *
     * Returns null when no divergent key exists in the pool (in which case
     * the dependent tests will skip rather than assert against placeholders).
     */
    function findDivergentKey(loc) {
        const placeholder = loc.findLocale(`__definitely_missing__`, `en`)
        const candidates = [
            `REQUEST_PING`,
            `SAY.SHORT_GUIDE`,
            `PAY.RECEIVED`,
            `BUY.SUCCESSFUL`,
            `ACTION_CANCELLED`,
            `COMMAND.STILL_COOLDOWN`
        ]
        for (const key of candidates) {
            loc.lang = `en`
            const enValue = loc.findLocale(key)
            loc.lang = `fr`
            const frValue = loc.findLocale(key)
            if (enValue && frValue && enValue !== placeholder && frValue !== placeholder && enValue !== frValue) {
                return { key, en: enValue, fr: frValue }
            }
        }
        return null
    }

    it(`resolves the requested lang when explicitly passed`, () => {
        const loc = new Localization()
        const sample = findDivergentKey(loc)
        if (!sample) return  // mocked-pool environment doesn't carry a divergent key; skip
        expect(loc.findLocale(sample.key, `en`)).to.equal(sample.en)
        expect(loc.findLocale(sample.key, `fr`)).to.equal(sample.fr)
    })

    it(`is not affected by the legacy singleton setter once a lang is passed`, () => {
        //  This is the heart of #4. Mutate the singleton to `fr`, then ask
        //  for `en` explicitly. The pre-fix code returned the French string.
        const loc = new Localization()
        const sample = findDivergentKey(loc)
        if (!sample) return
        loc.lang = `fr`
        expect(loc.findLocale(sample.key, `en`)).to.equal(sample.en)
        loc.lang = `en`
        expect(loc.findLocale(sample.key, `fr`)).to.equal(sample.fr)
    })

    it(`does not leak lang across interleaved closures`, async () => {
        //  Re-create the production race: two requests arrive on the same
        //  shard, each builds its own `(key) => findLocale(key, userData.lang)`
        //  closure, and an await interleaves them. Both must still resolve to
        //  their own locale.
        const loc = new Localization()
        const sample = findDivergentKey(loc)
        if (!sample) return

        async function pretendController(lang, deferMs) {
            const userData = { lang }
            const localeFn = (k) => loc.findLocale(k, userData.lang)
            //  Yield, like a real controller awaiting `getUserLocale` or a
            //  `reply.send(...)` between assignment and use.
            await new Promise(resolve => setTimeout(resolve, deferMs))
            return localeFn(sample.key)
        }

        const [a, b] = await Promise.all([
            pretendController(`fr`, 20),
            pretendController(`en`, 5)
        ])
        expect(a).to.equal(sample.fr)
        expect(b).to.equal(sample.en)
    })

    it(`uses the singleton setter as a fallback only when no lang is passed`, () => {
        //  Backward compat: `annie.js`'s buff-expiration DM still calls
        //  `findLocale(key)` without a lang argument and relies on the
        //  singleton. That path must keep working.
        const loc = new Localization()
        const sample = findDivergentKey(loc)
        if (!sample) return
        loc.lang = `fr`
        expect(loc.findLocale(sample.key)).to.equal(sample.fr)
        loc.lang = `en`
        expect(loc.findLocale(sample.key)).to.equal(sample.en)
    })

    it(`returns the placeholder for an invalid key regardless of lang`, () => {
        const loc = new Localization()
        const placeholderEn = loc.findLocale(undefined, `en`)
        const placeholderFr = loc.findLocale(undefined, `fr`)
        //  Invalid input should not vary by requester locale; both fall to the
        //  same `LOCALE_NOT_FOUND` placeholder.
        expect(placeholderEn).to.equal(placeholderFr)
        expect(placeholderEn).to.match(/i'?m sorry|LOCALE_NOT_FOUND/)
    })
})
