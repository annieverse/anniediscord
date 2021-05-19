const fs = require(`fs`)
const path = require(`path`)

/**
 *  Load image based on given id from default ./src/images/ directory.
 *  @param {String} id filename
 *  @param {string} assetsPath 
 *  @returns {Buffer}
 */
const loadAsset = async (id=``, assetsPath=`./src/assets`) => {
	let allFiles = fs.readdirSync(assetsPath)
	let ultimateFile
	allFiles.forEach(file => {
        let fileWithoutFormat = file.slice(0, -4)
		if (fileWithoutFormat === id) return ultimateFile = file 
	})
	if (!ultimateFile) {
        //  Replace path with default one
        assetsPath = `./src/assets`
        //  Refetch
	    allFiles = fs.readdirSync(assetsPath)
		allFiles.forEach((f) => {
			if (f.includes(`defaultcover1`)) {
				let filePath = `./${f.replace(/\\/g, `/`)}`
				return ultimateFile = filePath
			}
		})
	}
	return fs.readFileSync(assetsPath + `/` + ultimateFile)
}

module.exports = loadAsset
