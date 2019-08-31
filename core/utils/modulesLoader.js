console.time(`Commands Loaded`)
const { readdirSync } = require(`fs`)
const { Collection } = require(`discord.js`)
const commandsPath = `./core/modules/commands/`

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
		Client.commands = new Collection()
		Client.aliases = new Collection()

		let jsfile = this.fetchSource.filter(f => f.split(`.`).pop() === `js`)

		jsfile.forEach((f) => {
			let props = require(`../modules/commands/${f}`)
			Client.commands.set(props.help.name, props)
			props.help.aliases.forEach(alias => {
				Client.aliases.set(alias, props.help.name)
			})
		})

		return Client
	}
}

module.exports = modulesLoader