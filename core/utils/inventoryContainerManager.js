/**
 * 	Filtering object
 * 	@param {Object} container user inventory metadata
 * 	@Wrangle
 */
const Wrangle = ({container={}, strict=false}) => {
	//  Only remove unavailable items (0/null/undefined)
	let DefaultFilter = (obj) => obj.filter(prop => prop.quantity != false)
	//	Additionally excluding card from result if prompted
	let AdvancedFilter = (obj) => obj.filter(prop => (prop.quantity != false) && (prop.type != `Card`) && (prop.type != `Covers`) && (prop.type != `Roles`))
	//	Sorting object (descending)
	let Sorted = (obj) => obj.sort((a,b) => (a.quantity < b.quantity) ? 1 : ((b.quantity < a.quantity) ? -1 : 0))
	return strict ? Sorted(AdvancedFilter(container)) : Sorted(DefaultFilter(container))
}

module.exports = Wrangle