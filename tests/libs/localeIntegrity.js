
"use strict"
const { readdirSync } = require(`fs`)
const assert = require(`assert`)
class Locales {

    // Declare private variables
    #localesPool
    #errorMessage
    #lang
    #fallback = `en`

    constructor() {
        this.#setLocalesPool = `./src/locales/`
    }

    set #setLocalesPool(path = `./src/locales/`) {
        const fn = `[LOCALIZER]`
        const src = readdirSync(path)
        const locales = src.filter(loc => loc.endsWith(`json`))
        if (!locales.length) throw Error(`${fn} can't find any locales in '${path}'`)
        let localesPool = {}
        locales.forEach(file => {
            const localeCode = file.replace(/.json/, ``)
            localesPool[localeCode] = require(`../../src/locales/${file}`)
        })
        this.#localesPool = localesPool
    }

    get getLocalesPool() {
        return this.#localesPool
    }

    set #setErrorMessage(e) {
        this.#errorMessage = e
    }

    get getErrorMessage() {
        return this.#errorMessage
    }

    #objectsHaveSameKeys(obj, source) {
        function traverseAndFlatten(currentNode, target, flattenedKey) {
            for (var key in currentNode) {
                if (currentNode.hasOwnProperty(key)) {
                    var newKey;
                    if (flattenedKey === undefined) {
                        newKey = key;
                    } else {
                        newKey = flattenedKey + '.' + key;
                    }

                    var value = currentNode[key];
                    if (typeof value === "object") {
                        traverseAndFlatten(value, target, newKey);
                    } else {
                        target[newKey] = value;
                    }
                }
            }
        }

        function flatten(obj) {
            var flattenedObject = {};
            traverseAndFlatten(obj, flattenedObject);
            return Object.keys(flattenedObject)
        }

        const masterFlattened = flatten(source);

        function findMissingLocale(lang) {
            masterFlattened.sort()
            lang.sort()
            for (const key of masterFlattened) {
                if (lang.indexOf(key) === -1) {
                    return key
                }
            }
            return true
        }

        const langs = Object.keys(obj);
        for (const lang of langs) {
            let test = flatten(obj[lang])
            let testCase = test.sort().join(`,`) === masterFlattened.sort().join(`,`)
            if (!testCase) {
                let missingLocale = findMissingLocale(test)
                if (missingLocale != true && missingLocale != false) this.#setErrorMessage = `${lang} has an error, The locale "${missingLocale}" is missing.`
                return false
            }
        }
        return true
    }



    #findLocale(obj, source) {
        function traverseAndFlatten(currentNode, target, flattenedKey) {
            for (var key in currentNode) {
                if (currentNode.hasOwnProperty(key)) {
                    var newKey;
                    if (flattenedKey === undefined) {
                        newKey = key;
                    } else {
                        newKey = flattenedKey + '.' + key;
                    }

                    var value = currentNode[key];
                    if (typeof value === "object") {
                        traverseAndFlatten(value, target, newKey);
                    } else {
                        target[newKey] = value;
                    }
                }
            }
        }

        function flatten(obj) {
            var flattenedObject = {};
            traverseAndFlatten(obj, flattenedObject);
            return Object.keys(flattenedObject)
        }

        const masterFlattened = flatten(source);
        const pools = new Map(Object.entries(this.#localesPool))
        // console.log(pools)
        const fallback = this.#fallback

        function findLoc(lang, l) {
            masterFlattened.sort()
            lang.sort()
            let locale = undefined
            for (const key of lang) {
                try {
                    // console.log(pools)
                    locale = pools.get(l)[key] || pools.get(fallback)[key]
                } catch (error) {
                    console.log(error)
                    return key
                }
                // console.log(locale)
                if (locale == undefined) {
                    return key
                }
            }
            return true
        }


        const langs = Object.keys(obj);
        for (const lang of langs) {
            let test = flatten(obj[lang])
            let testCase = test.sort().join(`,`) === masterFlattened.sort().join(`,`)
            if (!testCase) {
                let missingFallback = findLoc(test, lang)
                console.log(`missingFallback`)
                console.log(missingFallback)
                if (missingFallback != true && missingFallback != false) this.#setErrorMessage = `${lang} has an error, The locale "${missingFallback}" is missing a fallback.`
                return false
            }
        }
        return true




    }

    compareLocales() {
        const masterLang = this.#localesPool.en
        const langs = this.#localesPool
        const result = this.#objectsHaveSameKeys(langs, masterLang)
        return true
    }

    hasFallback() {
        const masterLang = this.#localesPool.en
        const langs = this.#localesPool
        const result = this.#findLocale(langs, masterLang)
        return result
    }
}

describe(`Localization`, () => {
    const testLocale = new Locales()
    describe('compare locales to "en" locale', () => {
        it('should return true', () => {
            const result = testLocale.compareLocales()
            const errorMsg = testLocale.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    describe('If lang is missing "en" locale should have a fallback', () => {
        it('should return true', () => {

            const result = testLocale.hasFallback()
            const errorMsg = testLocale.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    /**
     * Add Test for if a lang is missing a value from "en", it should fallback to it.
     * Add test for ig a lang is in another lang file but is missing from "en"
     */
})
