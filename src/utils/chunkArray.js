/**
 * Chunk array into groups of arrays
 * @param {Array} array 
 * @param {Number} size 
 * @returns 
 */
const chunkOptions = (array, size) => {
    const chunkSize = size
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize)
        chunks.push(chunk)
    }
    return chunks
}

module.exports = chunkOptions