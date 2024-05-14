const { readdirSync } = require(`fs`)

/* Get target lang pools if available, if not - fallback to 'en'
* @param {string} [targetLang] Target language
* @param {string} [fallbackLang=`en`] Language to be used when target lang unexists
* @returns {object}
*/
const getTargetLocales = (targetLang, fallbackLang = `en`) => {
  /**
   * Retrieve available locales in the target directory
   * @param {string} [path=`./src/locales`] the target locale directory path
   * @return {object}
   */
  const LocalesPool = (path = `./src/locales/`) => {
    const fn = `[LOCALIZER]`
    const src = readdirSync(path)
    const locales = src.filter(loc => loc.endsWith(`json`))
    if (!locales.length) throw Error(`${fn} can't find any locales in '${path}'`)
    let localesPool = {}
    locales.forEach(file => {
      const localeCode = file.replace(/.json/, ``)
      localesPool[localeCode] = require(`../locales/${file}`)
    })
    return localesPool
  }
  const locales = LocalesPool()
  const TLang = targetLang.toLowerCase()
  const FBLang = fallbackLang.toLowerCase()
  if (!locales[TLang]) return locales[FBLang]
  return locales[TLang]
}

module.exports = { getTargetLocales }
