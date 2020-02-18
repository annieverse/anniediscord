const Discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./struct/commands/loader`)
const Database = require(`./struct/database`)
const logger = require(`./struct/logger`)
const keyv = require(`keyv`)
const express = require(`express`)
const locale = require(`./locales/default`)

class Annie extends Discord.Client {
	constructor() {
		super({ disableEveryone: true })

		this.startupInit = process.hrtime()
		this.logger = logger
		this.locale = locale
		this.config = config
		this.keyv = new keyv()
	}

	
	/**
	 * Listening to custom events
	 * @param {String} path events directory's path
	 */
	listeningToEvents(path=`./events/eventHandler`) {
		require(path)(this)
		this.logger.info(`Listening to events...`)
	}


	/**
	 * Specified port to be listened to
	 * @param {Number} port
	 */
	listeningToPort(port=this.config.port) {
		const app = express()
		app.get(`/`, (request, response) => response.sendStatus(200))
		app.listen(port)
		this.logger.info(`> Listening to port ${port}...`)
	}



	async initialize() {
		try {
			this.logger.info(ascii)
			this.logger.info(`Initializing ${process.env.NODE_ENV} server...`)
			

			// Starting new sql client instance
			this.db = await new Database().connect()
			// Initializing command modules
			this.commands = await new CommandsLoader().register()

			//this.login(process.env.TOKEN)
			this.logger.debug(`Logging in...`)
		}
		catch(error) {
			return this.logger.error(`Client terminated.`)
		}
	}
}

module.exports = Annie