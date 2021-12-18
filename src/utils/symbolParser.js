/**
 * Ommit unsupported symbols from string. Mainly used to support canvas-based UI.
 * @param {string} [str=``] Target string to be parsed. 
 * @return {string}
 */
const symbolParser = (str=``) => {
    str = str.replace(/[^\w\d\s*]/g, ``)
    return str
}

module.exports = symbolParser