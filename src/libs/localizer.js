"use strict"
const { Collection } = require(`discord.js`)
const { readdirSync } = require(`fs`)
const { localizerLogger:logger } = require(`../../pino.config`)
class Localization {

  #lang
  #fallback = `en`
  #path = `./src/locales/`
  #localesPool = new Collection()
  #availableLocales = {
    "english": `en`,
    "french": `fr`
  }

  constructor () {
    this.loadLocales()
  }

  get lang() {
    return this.#lang
  }

  set lang(l) {
    this.#lang = l
  }

  get availableLocales() {
    return this.#availableLocales
  }

  #traverseAndFlatten(currentNode, target, flattenedKey) {
    for (var key in currentNode) {
      if (Object.prototype.hasOwnProperty.call(currentNode, key)) {
        var newKey
        if (flattenedKey === undefined) {
          newKey = key
        } else {
          newKey = flattenedKey + `.` + key
        }

        var value = currentNode[key]
        if (typeof value === `object`) {
          if (Array.isArray(value)) {
            //  If value is an array, stop and set the key as an array
            target[newKey] = value
          } else {
            this.#traverseAndFlatten(value, target, newKey)
          }
        } else {
          target[newKey] = value
        }
      }
    }
  }
  #flatten(obj) {
    var flattenedObject = {}
    this.#traverseAndFlatten(obj, flattenedObject)
    return flattenedObject
  }

  /**
   * Placeholder message for final fallback.
   * @private
   * @return {string}
   */
  #placeholderFallback() {
    return `**i'm sorry !!** there seems to be an issue with the availability of my localized message. kindly help reporting this to my developers [in the support server.](https://discord.gg/HjPHCyG346) ; ;`
  }

  /**
   * Lookup target localized message.
   * @param {string=``} key target locale key (e.g. REQUEST_PING)
   * @return {string}
   */
  findLocale(key=``) {
    // 1. Target locale key validation
    if (!key || typeof key !== `string`) {
      logger.error({ action: `invalid_locale_key`, type: typeof key, key })
      return this.#placeholderFallback()
    }

    // 2. Look up the target locale first.
    let locale = this.#localesPool.get(this.#lang)?.get(key)
    if (locale) return locale

    // 3. If not found, try fallback variant of the locale.
    logger.warn({ action: `origin_locale_missing`, lang: this.#lang, key })
    locale = this.#localesPool.get(this.#fallback)?.get(key)
    if (locale) return locale

    // 4. If none of them exist, last-resort to use placeholder fallback (100% availability)
    logger.warn({ action: `fallback_locale_missing`, lang: this.#fallback, key })
    return this.#placeholderFallback()
  }

  loadLocales() {
    this.#createLocalesPool(this.#path)
  }

  /**
   * Retrieve available locales in the target directory
   * @param {string} [path=`./src/locales`] the target locale directory path
   * @return {object}
   */
  #createLocalesPool = (path = `./src/locales/`) => {
    const fn = `[LOCALIZER]`
    const src = readdirSync(path)
    const locales = src.filter(loc => loc.endsWith(`json`))
    if (!locales.length) throw Error(`${fn} can't find any locales in '${path}'`)
    return locales.forEach(file => {
      const localeCode = file.replace(/.json/, ``)
      let localeJSON = require(`../locales/${file}`)
      let flattenJSON = this.#flatten(localeJSON)
      this.#localesPool.set(localeCode, new Collection(Object.entries(flattenJSON)))
    })
  }

}

module.exports = { Localization }
