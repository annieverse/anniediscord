const { readdirSync } = require(`fs`)
/**
 * A utility class that retrieves available locales in the target directory.
 */
class Localizer {
    /**
     * Creates a new instance of the Localizer class.
     * @param {string} [path=`./src/locales`] - The target locale directory path.
     */
    constructor(path = `./src/locales/`) {
      // The name of the function for logging.
      this.fn = `[LOCALIZER]`;
  
      // The path of the target locale directory.
      this.path = path;
  
      // The pool of available locales.
      this.localesPool = {};
  
      // The list of files in the target directory.
      this.src = readdirSync(path);
  
      // Filter the list of files to only include .json files.
      const locales = this.src.filter((loc) => loc.endsWith(`json`));
  
      // Throw an error if there are no locales available.
      if (!locales.length) {
        throw Error(`${this.fn} can't find any locales in '${path}'`);
      }
  
      // Add each available locale to the pool.
      locales.forEach((file) => {
        const localeCode = file.replace(/.json/, ``);
        this.localesPool[localeCode] = require(`../locales/${file}`);
      });
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
      return this.localesPool;
    }
  }
  
  module.exports = Localizer
  