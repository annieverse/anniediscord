const { Collection } = require(`discord.js`)
const { readdirSync } = require(`fs`)
const logger = require(`../logger`)

class Loader {
	constructor() {
		this.commandsPath = `./src/commands/`
		this.queryOnFile = null
	}


	/**
	 * 	Assigning fetchSource() result to @client
	 */
	register(client) {
		let initModulesLoad = process.hrtime()

		//	Initialize new collection in the client
		client.commands = new Collection()
		client.aliases = new Collection()

		try {

			let directories = readdirSync(this.commandsPath)
			let totalFiles = 0
			for (const index in directories) {
				const files = readdirSync(this.commandsPath + directories[index])
				const jsfile = files.filter(f => f.split(`.`).pop() === `js`)
				jsfile.forEach((f) => {
					this.queryOnFile = f
					const props = require(`../../commands/${directories[index]}/${f}`)
					client.commands.set(props.help.name, props)
					props.help.aliases.forEach(alias => {
						client.aliases.set(alias, props.help.name)
					})
					totalFiles++
					this.queryOnFile = f
				})
			}

			//	Log & Return the updated client
			logger.info(`> ${totalFiles} commands successfully loaded (${client.getBenchmark(process.hrtime(initModulesLoad))})`)
			return client

		}
		catch (e) {
			logger.error(`Failed to register ${this.queryOnFile} command > ${e.stack}`)
			throw e
		}
	}
}

module.exports = Loader