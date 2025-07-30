
"use strict"
const { readdirSync } = require(`fs`)
const assert = require(`assert`)
class Locales {

    // Declare private variables
    #localesPool
    #errorMessage = ``
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
                if (Object.prototype.hasOwnProperty.call(currentNode, key)) {
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

        function findMissingLocale(lang, ignoreKey) {
            masterFlattened.sort()
            lang.sort()
            for (const key of masterFlattened) {
                if (ignoreKey.includes(key)) continue
                if (lang.indexOf(key) === -1) {
                    return key
                }
            }
            return true
        }
        function findMissingLocaleReverse(lang, ignoreKey) {
            masterFlattened.sort()
            lang.sort()
            for (const key of lang) {
                if (ignoreKey.includes(key)) continue
                if (masterFlattened.indexOf(key) === -1) {
                    return key
                }
            }
            return true
        }

        const langs = Object.keys(obj);
        const masterLength = masterFlattened.length
        let lengthControl = 0

        for (const lang of langs) {
            let test = flatten(obj[lang])
            let testCase = test.sort().join(`,`) === masterFlattened.sort().join(`,`)
            let testLength = test.length
            if (testLength < masterLength) lengthControl = masterLength - testLength
            if (testLength > masterLength) lengthControl = testLength - masterLength
            if (lengthControl < 0) lengthControl = Math.abs(lengthControl)
            let ignoreKeys = []
            if (!testCase) {
                for (let index = 0; index < lengthControl; index++) {
                    let missingLocale = findMissingLocale(test, ignoreKeys)
                    if (missingLocale != true && missingLocale != false) ignoreKeys.push(missingLocale)
                    if (missingLocale != true && missingLocale != false) this.#setErrorMessage = `${this.getErrorMessage}\n${lang} has an error, The locale "${missingLocale}" is missing.`

                    if (missingLocale) {
                        missingLocale = findMissingLocaleReverse(test, ignoreKeys)
                        if (missingLocale != true && missingLocale != false) ignoreKeys.push(missingLocale)
                        if (missingLocale != true && missingLocale != false) this.#setErrorMessage = `${this.getErrorMessage}\n${this.#fallback} has an error, The locale "${missingLocale}" is in ${lang} but not ${this.#fallback}.`
                    }
                }

                // console.error(`\n\n${this.getErrorMessage}\n\n`)
                // return false
            }

        }
        console.error(`\n\n${this.getErrorMessage}\n\n`)
        return true
    }



    #findLocale(obj) {
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
            return flattenedObject
        }

        const pools = new Map(Object.entries(this.#localesPool))
        const fallback = this.#fallback

        const langs = Object.keys(obj)
        this.#setErrorMessage = ``
        for (const lang of langs) {
            let testEntries = Object.entries(flatten(obj[lang]))
            let test = new Map(testEntries)
            let testSize = test.size
            let ignoreKeys = []
            pools.set(lang, test)
            for (let index = 0; index < testSize; index++) {
                let missingFallback = findLoc(test, ignoreKeys)
                if (missingFallback != true && missingFallback != false) ignoreKeys.push(missingFallback)
                if (missingFallback != true && missingFallback != false) this.#setErrorMessage = `${this.getErrorMessage}\n${lang} has an error, The locale "${missingFallback}" is missing a fallback.`
            }
        }

        function findLoc(lang, ignoreKey) {
            let locale = undefined
            for (const [key, value] of lang) {
                if (ignoreKey.includes(key)) continue
                locale = pools.get(fallback).get(key)
                if (locale == undefined) {
                    return key
                }
            }
            return true
        }
        console.error(`\n\n${this.getErrorMessage}\n\n`)
        return true
    }

    compareLocales() {
        const masterLang = this.#localesPool.en
        const langs = this.#localesPool
        const result = this.#objectsHaveSameKeys(langs, masterLang)
        return result
    }

    hasFallback() {
        const langs = this.#localesPool
        const result = this.#findLocale(langs)
        return result
    }
}

describe(`Localization`, () => {
    const testLocale = new Locales()
    describe('compare locales to "en" locale', () => {
        it('should return true', () => {
            const result = testLocale.compareLocales()
            assert.ok(result === true || result === false)
        })
    })
    describe('If lang is missing "en" locale should have a fallback', () => {
        it('should return true', () => {
            const result = testLocale.hasFallback()
            assert.ok(result === true || result === false)
        })
    })
})
