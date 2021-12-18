	/**
	 * Get closest below element of an array
	 * @param {array} [array=[]] source to be search in
	 * @param {number} [val=1] value comparator 
     * @returns {?element}
	 */
	const closestBelow = (array=[], val=1) => {
		return Math.max.apply(null, array.filter((v) => v <= val ))
	}

	module.exports = closestBelow