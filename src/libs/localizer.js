const { readdirSync } = require(`fs`)
const {localizerLogger:logger} = require(`../../pino.config`)
/**
 * A utility class that retrieves available locales in the target directory.
 */
class Localizer {
    /**
     * Creates a new instance of the Localizer class.
     * @param {string} [path=`./src/locales`] - The target locale directory path.
     * @param {string} [defaultLang=`en`] - The default lang to be used. Must present in the locales dir
     */
    constructor(path = `./src/locales/`, defaultLang = `en`) {
      // The name of the function for logging.
      this.fn = `[LOCALIZER]`
  
      // The path of the target locale directory.
      this.path = path
  
      // The pool of available locales.
      this.localesPool = {}

      // The codes pool of available locales.
      this.localeCodesPool = []
  
      // The list of files in the target directory.
      this.src = readdirSync(path)

      // Lang to be used by default
      this.defaultLang = defaultLang
  
      // Filter the list of files to only include .json files.
      const locales = this.src.filter((loc) => loc.endsWith(`json`))
  
      // Throw an error if there are no locales available.
      if (!locales.length) {
        logger.error(`${this.fn} can't find any locales in '${path}'`)
      }
  
      // Load the default locale first
      const defaultLocale = locales.find((file) => file.replace(/.json/, ``) === this.defaultLang)
      if (!defaultLocale) {
        logger.error(`${this.fn} default locale '${this.defaultLang}' does not exist`)
      }

      const defaultLocaleCode = defaultLocale.replace(/.json/, ``)
      this.localeCodesPool.push(defaultLocaleCode)
      this.localesPool[defaultLocaleCode] = require(`../locales/${defaultLocale}`)
      logger.info(`${defaultLocaleCode} loaded as default locale.`)

      // Load other available locales
      locales
      .filter((file) => file !== defaultLocale)
      .forEach((file) => {
        const localeCode = file.replace(/.json/, ``)
        const targetLocaleFile = require(`../locales/${file}`)
        //  If structure are similar/same, proceed
        if (this.compareLocaleKeys(this.localesPool[defaultLocaleCode], targetLocaleFile)) {
          this.localeCodesPool.push(localeCode)
          this.localesPool[localeCode] = targetLocaleFile
          logger.info(`${localeCode} registered.`)
        }
        else {
          logger.warn(`${localeCode} has incomplete localization, will be excluded from the pool.`)
        }
      })
    }

    /**
     * Get target lang pools if available, if not - fallback to 'en'
     * @param {string} [targetLang] Target language
     * @param {string} [fallbackLang=`en`] Language to be used when target lang unexists
     * @returns {object}
     */
    getTargetLocales(targetLang, fallbackLang=`en`) {
        targetLang = targetLang.toLowerCase()
        fallbackLang = fallbackLang.toLowerCase()
        let isFallingback = false
        let pool = this.localesPool[targetLang]
        if (!pool) {
            pool = this.localesPool[fallbackLang]
            isFallingback = true
        }
        // For lang context
        pool.__metadata = {
            targetLang: targetLang,
            fallbackLang: fallbackLang,
            isFallingback: isFallingback
        }
        return pool
    }

    /**
     * Gets the pool of available locales.
     * @returns {object} - The pool of available locales.
     */
    getLocalesPool() {
      return this.localesPool
    }

    /**
     * Check if the target locale object has all the keys as in the source/first locale object.
     * Used to determine if a locale object is ready to use or not.
     * @param {object} obj1
     * @param {object} obj2
     * @return {boolean}
     */
    compareLocaleKeys(obj1, obj2) {
      const keys1 = Object.keys(obj1)
      const keys2 = Object.keys(obj2)
      if (keys1.length !== keys2.length) {
        return false
      }

      for (let key of keys1) {
        if (!keys2.includes(key)) {
          return false
        }
        // Check if the values of the keys are objects and recursively compare them
        if (typeof obj1[key] === `object` && typeof obj2[key] === `object`) {
          if (!this.compareLocaleKeys(obj1[key], obj2[key])) {
            return false
          }
        }
      }
      return true
    }
  }
  
  module.exports = Localizer
  