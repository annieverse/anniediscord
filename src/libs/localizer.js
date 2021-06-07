const { readdirSync } = require(`fs`)
/**
 * Retrieve available locales in the target directory
 * @param {string} [path=`./src/locales`] the target locale directory path
 * @return {object}
 */
module.exports = function localizer(client, path=`./src/locales/`) {
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
