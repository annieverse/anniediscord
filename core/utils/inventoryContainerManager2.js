/**
 * 	Filtering object
 * 	@param {Object} container user inventory metadata
 * 	@Wrangle
 */
const Wrangle = (container) => {
	//  Removing unavailable items (0/null/undefined)
	let Filtered = (obj) => obj.filter(prop => prop.quantity != false)
	//	Sorting object (descending)
	let Sorted = (obj) => obj.sort((a,b) => (a.quantity < b.quantity) ? 1 : ((b.quantity < a.quantity) ? -1 : 0))
	return Sorted(Filtered(container))
}

module.exports = Wrangle