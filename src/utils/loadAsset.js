const fs = require(`fs`)
const path = require(`path`)

/**
 *  Load image based on given id from default ./src/images/ directory.
 *  @param {String} id filename
 *  @param {string} assetsPath 
 *  @returns {Buffer}
 */
const loadAsset = async (id=``, assetsPath=`./src/assets`) => {
	// List all files in a directory in Node.js recursively in a synchronous fashion
	const walkSync = (dir, filelist = []) => {
		fs.readdirSync(dir).forEach(file => {
			filelist = fs.statSync(path.join(dir, file)).isDirectory()
				? walkSync(path.join(dir, file), filelist)
				: filelist.concat(path.join(dir, file))
		})
		return filelist
	}
	let allFiles = walkSync(assetsPath) // Starts with the main directory and includes all files in the sub directories
	let ultimateFile
	allFiles.forEach((file) => {
		if (file.includes(id)){
			let filePath = `./${file.replace(/\\/g, `/`)}`
			return ultimateFile = filePath
		}
	})
	if (!ultimateFile) {
		allFiles.forEach((f) => {
			if (f.includes(`defaultcover1`)) {
				let filePath = `./${f.replace(/\\/g, `/`)}`
				return ultimateFile = filePath
			}
		})
	}
	return fs.readFileSync(ultimateFile)
}

module.exports = loadAsset