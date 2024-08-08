"use strict"
const assert = require(`assert`)
class commandStructureChecker {

    // Declare private variables
    #baseLevel = [`name`, `aliases`, `description`, `usage`, `permissionLevel`, `multiUser`, `applicationCommand`, `messageCommand`, `server_specific`,`name_localizations`,`description_localizations`]
    #langSupported = [`en-US`,`fr`] // https://discord.com/developers/docs/reference#locales
    #errorMessage
    #commandLoaderPath = `../../src/commands/loader.js`
    #commandFiles

    constructor(file) {
        this.#setCommandFiles = file
    }

    set #setCommandFiles(a) {
        const commandsLoader = require(this.#getCommandLoaderPath)
        this.#commandFiles = commandsLoader(a)
    }

    get #getCommandLoaderPath() {
        return this.#commandLoaderPath
    }

    get #getCommandFiles() {
        return this.#commandFiles
    }

    get #getBaseLevel() {
        return this.#baseLevel
    }

    set #setErrorMessage(e) {
        this.#errorMessage = e
    }

    get getErrorMessage() {
        return this.#errorMessage
    }

    get #getLangSupported(){
        return this.#langSupported
    }
    /**
     * Return a Boolean if a object has a property or not
     * @param {object} object 
     * @param {string} prop 
     * @returns {boolean}
     */
    #hasProp(object, prop) {
        return Object.hasOwn(object, prop)
    }

    checkBaseProps() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = this.#getBaseLevel[index];
                const result = this.#hasProp(value, baseKey)
                if (!result) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${baseKey} from its properties`
                    return false
                } else if (baseKey === `name_localizations` || baseKey === `description_localizations`){
                    const langs = this.#getLangSupported
                    var errorMsg = ``
                    for (const l of langs) {
                        if (!this.#hasProp(value, l)) {
                            errorMsg += `Needs Lang ${l} added\n`
                        } else if (baseKey === `name_localizations` && value?.[baseKey] != value?.[baseKey].toLowerCase()) {
                            errorMsg += `Lang ${l} > Needs to be all lowercased`
                        }               
                    }
                    this.#setErrorMessage = `Command file "${value?.name}" has an error(s), The key: ${baseKey} >\n${errorMsg}`
                    return false
                }

                if (value?.name != value?.name.toLowerCase()){
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The key: ${baseKey} > Needs to be all lowercased`
                    return false
                }
            }
        }
        return true
    }

    checkPrefixImmune() {
        const setPrefixCmd = this.#getCommandFiles.ALL_COMMANDS.get(`setprefix`)
        return this.#hasProp(setPrefixCmd, `prefixImmune`)
    }

    checkServerSpecificCmds() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = `server_specific`
                const secondaryKey = `servers`
                const result = this.#hasProp(value, baseKey)
                if (!result) continue
                if (!value[baseKey]) continue
                const secondaryResult = this.#hasProp(value, secondaryKey)
                if (!secondaryResult) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${secondaryKey} from its properties`
                    return false
                }
            }
        }
        return true
    }

    checkAppCmds() {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            for (let index = 0; index < this.#getBaseLevel.length; index++) {
                const baseKey = `applicationCommand`
                const typeKey = `type`
                const result = this.#hasProp(value, baseKey)
                if (!result) continue
                if (!value[baseKey]) continue
                const appTypeResult = this.#hasProp(value, typeKey)
                if (!appTypeResult) {
                    this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing ${typeKey} from its properties`
                    return false
                }
            }
        }
        return true
    }

    checkAppCmdsOpt(key) {
        for (const value of this.#getCommandFiles.ALL_COMMANDS.values()) {
            const baseKey = `applicationCommand`
            const secondaryKey = `options`
            const result = this.#hasProp(value, baseKey)
            if (!result) continue
            if (!value[baseKey]) continue
            const secondaryResult = this.#hasProp(value, secondaryKey)
            if (secondaryResult) {
                const arr = value[secondaryKey]
                for (const o of arr) {
                    const res = this.checkOpt(o, key, value)
                    if (!res) return false
                }
            }
        }
        return true
    }

    checkOpt(parent, key, value) {
        const secondaryKey = `options`
        const res = this.check(parent, key, value)
        if (!res) return false
        if (this.#hasProp(parent, secondaryKey)) {
            const inner = parent[secondaryKey]
            for (const o of inner) {
                return this.checkOpt(o, key, value)
            }
        }
        return true
    }

    check(obj, k, value) {
        if (!this.#hasProp(obj, k)) {
            this.#setErrorMessage = `Command file "${value?.name}" has an error, The file is missing additional key: ${k}`
            return false
        }
        if (k === `name`) {
            if (obj[k] != obj[k].toLowerCase()) {
                this.#setErrorMessage = `Command file "${value?.name}" has an error, The key: ${k} > Needs to be all lowercased`
                return false
            }
        } else if (k === `name_localizations` || k === `description_localizations`){
            const langs = this.#getLangSupported
            var errorMsg = ``
            for (const l of langs) {
                if (!this.#hasProp(value, l)) {
                    errorMsg += `Needs Lang ${l} added\n`
                } else if (baseKey === `name_localizations` && value?.[k] != value?.[k].toLowerCase()) {
                    errorMsg += `Lang ${l} > Needs to be all lowercased`
                }               
            }
            this.#setErrorMessage = `Command file "${value?.name}" has an error(s), The key: ${k} >\n${errorMsg}`
            return false
        }
        return true
    }
}

describe(`Commands`, () => {
    const commandTester = new commandStructureChecker(`./src/commands`)
    describe(`All command files should have base level properties`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkBaseProps()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    describe(`setprefix command should have the property "prefixImmune"`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkPrefixImmune()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    describe(`server_specific command(s) should have the property "servers"`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkServerSpecificCmds()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })

    describe(`application commands should have the following properties`, () => {
        it(`should return true for property: type`, () => {
            const result = commandTester.checkAppCmds()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
        describe(`If application command has an option property it should have the following properties`, () => {
            it(`should return true for property: name`, () => {
                const result = commandTester.checkAppCmdsOpt(`name`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: name_localizations`, () => {
                const result = commandTester.checkAppCmdsOpt(`name_localizations`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: description`, () => {
                const result = commandTester.checkAppCmdsOpt(`description`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: description_localizations`, () => {
                const result = commandTester.checkAppCmdsOpt(`description_localizations`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: type`, () => {
                const result = commandTester.checkAppCmdsOpt(`type`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
        })
    })
})
