const { Collection } = require(`discord.js`)
const fs = require(`fs`)

class CommandsLoader {
	/**
	 * @param {String} path commands root's directory path 
	 */
	constructor(path = `./src/commands/`) {
		this.commandsPath = path
		this.commands = new Collection()
		this.aliases = new Collection()
		this.queryOnFile = null
		this.queryOnDir = null
		this.totalFiles = 0
	}


	default() {
		try {
			/**
			 * Recursively pull available categories in command's root directory
			 * @example user/system/social/shop/etc
			 */
			fs.readdir(this.commandsPath, directories => {
				for (const index in directories) {
					const dir = directories[index]
					this.queryOnDir = dir
					/**
					 * Recursively pull files from a category
					 * @example user/system/social/shop/etc
					 */
					fs.readdir(this.commandsPath + dir, files => {
						const jsfile = this._getJsFiles(files)
						jsfile.forEach((file) => {
							this.register(dir, file)

							// Iteration checkpoints
							this.totalFiles++
							this.queryOnFile = file
						})
					})
				}
			})
			return { 
				commands : this.commands,
				aliases : this.aliases,
				totalFiles : this.totalFiles
			}
		}
		catch (error) {
			throw Error(`Failed to register ${this.queryOnDir}/${this.queryOnFile}`)
		}
	}

	
	/**
	 * @type {Private}
	 * @param {String} category the parent directory's name
	 * @param {String} file the command's filename
	 * @param {Boolean} ejectImmediately set to true if you want to return the registered
	 * command without using .default() method first. Optional.
	 */
	register(category=``, file=``, ejectImmediately=false) {
		const src = require(`../../commands/${category}/${file}`)
		
		this.commands.set(src.help.name, src)
		src.help.aliases.forEach(alias => {
			this.aliases.set(alias, src.help.name)
		})

		if (ejectImmediately) return {
			commands : this.commands,
			aliases : this.aliases
		}
	}


	/**
	 * @type {Private}
	 * @param {Array} files list of files from fs.readdir 
	 * @returns {Array}
	 */
	_getJsFiles(files=[]) {
		return files.filter(f => f.split(`.`).pop() === `js`)
	}
}

module.exports = CommandsLoader