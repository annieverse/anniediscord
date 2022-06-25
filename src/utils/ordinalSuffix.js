/**
 * Adding ordinx behind the given number.
 * @param {number} [i=0] target number
 */
const ordinalSuffix = (i=0) =>  {
	var j = i % 10,
		k = i % 100
	if (j == 1 && k != 11) {
		return i + `st`
	}
	if (j == 2 && k != 12) {
		return i + `nd`
	}
	if (j == 3 && k != 13) {
		return i + `rd`
	}
	return i + `th`
}

module.exports = ordinalSuffix