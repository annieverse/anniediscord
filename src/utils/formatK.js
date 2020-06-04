/**
 * Formatting number into K format.
 * @param {number} [num=0] the target number
 */
const formatK = (num=0) => {
	return !num ? 0 : ( num > 999999 ? (num / 1000000).toFixed(1) + `M` : num > 999 ? (num / 1000).toFixed(1) + `k` : num)
}

module.exports = formatK