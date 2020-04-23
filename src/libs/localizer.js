const { readdirSync } = require(`fs`)
const logger = require(`./logger`)

/**
 * Annie's localization manager.
 * @param {string} [path=`./src/locales`] the target locale directory path
 */
class Localizer {
    constructor(path=`./src/locales/`) {
        /**
         * Locales folder path
         * @type {string}
         */
        this.localesPath = path

        /**
         * Available locale codename for developer references.
         * @type {array}
         */
        this.localesCode = []
        this.registerLocales()
    }

    /**
     * Register locales into this class property. Can be accessed through `this[languageCode]` afterwards.
     * @returns {Localizer} This localizer
     */
	registerLocales() {
        const fn = `[Localizer.registerLocales()]`
        const locales = this.locales
        if (!locales.length) throw Error(`${fn} can't find any locales in '${this.localesPath}'`)
        locales.forEach(file => {
            const localeCode = file.replace(/.json/, ``)
            this[localeCode] = require(`../locales/${file}`)
            this.localesCode.push(localeCode)
            logger.info(`${fn} "${localeCode}" successfully loaded`)
        })
        return this
    }

    /**
     * Get available locale files in the locales directory path.
     * @type {array} 
     */
    get locales() {
        return readdirSync(this.localesPath)
    }
}

module.exports = Localizer