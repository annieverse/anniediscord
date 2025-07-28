"use strict"
const { Collection } = require(`discord.js`)
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

class Localization {

  #lang
  #fallback = `en`
  #path = `./src/locales/`
  #localesPool = new Collection()
  #availableLocales = {
    "english": `en`,
    "french": `fr`
  }

  constructor() {
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

  findLocale(key) {
    let locale = undefined
    try {
      locale = this.#localesPool.get(this.#lang).get(key) || this.#localesPool.get(this.#fallback).get(key)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
      // eslint-disable-next-line no-console
      return console.error(`The specified key is not an available language path.\nKey supplied and tried > ${key}`)
    }
    // eslint-disable-next-line no-console
    if (locale == undefined) return console.error(`The specified key is not an available language path.\nKey supplied and tried > ${key}`)
    return locale
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
      let localeJson = require(`../locales/${file}`)
      this.#localesPool.set(localeCode, new Collection(Object.entries(localeJson)))
    })
  }

}

module.exports = { getTargetLocales, Localization }
