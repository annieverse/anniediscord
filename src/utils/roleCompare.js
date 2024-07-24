"use strict"
/**
 * Return if roleOne is under higher role
 * @param {role} roleOne 
 * @param {role} highRole 
 * @returns {boolean}
 */
const roleCompare = (roleOne, highRole) => {
	const roleCompare = roleOne.comparePositionTo(highRole)
	return roleCompare >= 1 ? false : true
}
module.exports = roleCompare