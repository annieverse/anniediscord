const { Collection } = require(`discord.js`)
const fs = require(`fs`)
const logger = require(`../logger`)
const getBenchmark = require(`../../utils/getBenchmark`)

class CommandsLoader {
	constructor() {
		this.commandsPath = `./src/commands/`
		this.queryOnFile = null
		this.queryOnDir = null
	}


	register() {
		let initTime = process.hrtime()
		let commands = new Collection()
		let aliases = new Collection()

		try {

			let directories = fs.readdirSync(this.commandsPath)
			let totalFiles = 0
			for (const index in directories) {
				this.queryOnDir = directories[index]
				const files = fs.readdirSync(this.commandsPath + directories[index])
				const jsfile = files.filter(f => f.split(`.`).pop() === `js`)
				jsfile.forEach((f) => {
					this.queryOnFile = f
					const props = require(`../../commands/${directories[index]}/${f}`)
					commands.set(props.help.name, props)
					props.help.aliases.forEach(alias => {
						aliases.set(alias, props.help.name)
					})
					totalFiles++
					this.queryOnFile = f
				})
			}

			logger.info(`> ${totalFiles} commands successfully loaded (${getBenchmark(initTime)})`)
			return { commands, aliases }

		}
		catch (error) {
			logger.error(`Failed to register ${this.queryOnDir}/${this.queryOnFile} > ${error.message}`)
			throw error
		}
	}
}

module.exports = CommandsLoader