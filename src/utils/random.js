/**
 * Gets random result from given array.
 * @param {object} [src=[]] Target array.
 * @return {*}
 */
const random = (src=[]) => src[Math.floor(Math.random() * src.length)]
module.exports = random
