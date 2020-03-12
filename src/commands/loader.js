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
		/**
		 * Recursively pull available categories in command's root directory
		 * @example user/system/social/shop/etc
		 */
		let directories = fs.readdirSync(this.commandsPath).filter(file => !file.includes(`.`))

		for (const index in directories) {
			const dir = directories[index]
			this.queryOnDir = dir
			/**
			 * Recursively pull files from a category
			 * @example user/system/social/shop/etc
			 */
			const files = fs.readdirSync(this.commandsPath + dir)
			const jsfile = this.getJsFiles(files)
			jsfile.forEach(file => {
				this.register(dir, file)

				// Iteration checkpoints
				this.totalFiles++
				this.queryOnFile = file
			})
		}
		return { 
			names : this.commands,
			aliases : this.aliases,
			totalFiles : this.totalFiles
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
		const src = require(`./${category}/${file}`)
		
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
	 * @param {Array} files list of files from fs.readdir 
	 * @returns {Array}
	 */
	getJsFiles(files=[]) {
		return files.filter(f => f.split(`.`).pop() === `js`)
	}
}

module.exports = CommandsLoader