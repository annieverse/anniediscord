const { readdirSync } = require(`fs`)
const { Collection } = require(`discord.js`)
const commandsPath = `./core/modules/commands/`
const logger = require(`./config/winston`)

class modulesLoader {


	/**
	 * 	Get all files in commands directory
	 */
	get fetchSource() {
		return readdirSync(commandsPath)
	}


	/**
	 * 	Assigning fetchSource() result to @Client
	 */
	register(Client) {
		let initModulesLoad = process.hrtime()

		//	Initialize new collection in the client
		Client.commands = new Collection()
		Client.aliases = new Collection()

		try {

			//	Get all the .js files
			let jsfile = this.fetchSource.filter(f => f.split(`.`).pop() === `js`)


			//	Recursively registering commands
			jsfile.forEach((f) => {
				let props = require(`../modules/commands/${f}`)
				Client.commands.set(props.help.name, props)
				props.help.aliases.forEach(alias => {
					Client.aliases.set(alias, props.help.name)
				})
			})


			//	Log & Return the updated client
			logger.info(`${jsfile.length} command modules loaded (${Client.getBenchmark(process.hrtime(initModulesLoad))})`)
			return Client

		}
		catch (e) {

			//	Log & return the old client
			logger.error(`Failed to load commands module > ${e.stack}`)
			return Client

		}
	}
}

module.exports = modulesLoader