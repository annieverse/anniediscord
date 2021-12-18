/**
 *  Add comma separator on given number. Only applies to number above 3 digits.
 *  @param {number} [number=0] target number to be parsed from
 *  @param {boolean} [roundUp=true] Transform targer number into a rounded number before gets replaced with commas. Optional.
 *  @returns {string}
 */
const commanifier = (number = 0, roundUp = true) => {
    if (roundUp) number = Math.round(number)
    return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`) : 0
}

module.exports = commanifier