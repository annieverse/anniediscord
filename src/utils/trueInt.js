/**
 * Automatically convert any weird number notation into a real value.
 * @author Fwubbles
 * @param {String} str target string
 * @returns {Number/NaN}
 */
const trueInt = (str=``) => {
    return (!Number.isNaN(Number(str)) && !(Math.round(Number(str)) <= 0) && Number.isFinite(Number(str))) 
        ? Math.round(Number(str)) : NaN
}
module.exports = trueInt

