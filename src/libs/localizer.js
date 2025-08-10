"use strict"
const { Collection } = require(`discord.js`)
const { readdirSync } = require(`fs`)

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

  findLocale(key) {
    let locale = this.#localesPool.get(this.#lang).get(key) || this.#localesPool.get(this.#fallback).get(key)
    const DATE = new Date()
    try {
      if (locale == undefined) {
        // eslint-disable-next-line no-console
        console.error(`${DATE} | The specified key is not an available language path.\nKey supplied and tried > ${key}`)
        throw new Error(`[LOCALIZER] The specified key '${key}' is not available in the current locale '${this.#lang}' or fallback '${this.#fallback}'.`)
      }
      return locale
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`${DATE} | [LOCALIZER] Error while trying to find locale for key '${key}'`, e)
      if (locale == undefined || key === `LOCALE_NOT_FOUND`) {
        // If the key is not found, return a placeholder error message
        return "Locale not found";
      }
      // If the key is not found, return placeholder error message
      // Prevent infinite recursion: if LOCALE_NOT_FOUND is missing, return hardcoded error
      const fallbackLocale = this.#localesPool.get(this.#lang)?.get("LOCALE_NOT_FOUND") || this.#localesPool.get(this.#fallback)?.get("LOCALE_NOT_FOUND");
      return fallbackLocale || "Locale not found";
    }
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
