/**
 * Get random nunmber inside given range.
 * @param {object} [range=[0, 1]] min max numbers.
 * @return {number}
 */
function getNumberInRange(range) {
    const [min, max] = range
    return Math.floor(Math.random() * (max - min + 1) + min)
}
module.exports = getNumberInRange
