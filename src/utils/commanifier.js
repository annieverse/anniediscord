/**
 *  Add comma separator on given number. Only applies to number above 3 digits.
 *  @param {number} [number=0] target number to be parsed from
 *  @returns {string}
 */
const commanifier = (number=0) => {
	return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`) : 0
}

module.exports = commanifier