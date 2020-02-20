const Discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./struct/commands/loader`)
const Database = require(`./struct/database`)
const logger = require(`./struct/logger`)
const Keyv = require(`keyv`)
const Express = require(`express`)
const locale = require(`./locales/default`)

class Annie extends Discord.Client {
	constructor() {
		super({ disableEveryone: true })
		this.startupInit = process.hrtime()
		this.logger = logger
		this.locale = locale
		this.config = config
		this.keyv = new Keyv()
	}

	
	/**
	 * @desc default option for deploying Annie's Client with its full features
	 * such as database access and reachable interactions through custom commands.
	 */
	async default() {
		try {
			this.promiseRejectionHandler()
			this.logger.info(ascii.default)
			this.logger.info(`Initializing ${process.env.NODE_ENV} server...`)
			this.db = await new Database().connect()
			this.commands = await new CommandsLoader().register()
			this.listeningToPort()
			require(`./events/eventHandler`)(this)
			this.logger.info(`Logging in...`)
			this.login(process.env.TOKEN)
		}
		catch(error) {
			return this.logger.error(`Client terminated.`)
		}
	}


	/**
	 * @desc This method has eliminated some of processes such as database connection
	 * and commands loader to reduce the client load.
	 * Intentionally made for fun and internal monitoring without reachable interactions as end user.
	 */
	minimal() {
		try {
			this.logger.info(ascii.minimalist)
			this.logger.info(`Initializing ${process.env.NODE_ENV} server...`)
			this.logger.info(`Logging in...`)
			this.login(process.env.TOKEN)
		}
		catch(error) {
			return this.logger.error(`Client terminated.`)
		}
	}


	listeningToPort(port=this.config.port) {
		const app = Express()
		app.get(`/`, (request, response) => response.sendStatus(200))
		app.listen(port)
		this.logger.info(`Listening to port ${port}`)
	}


	promiseRejectionHandler() {
		process.on(`unhandledRejection`, (err) => {
			this.logger.error(`Promise Rejection. ${err.message}`)
		})
	}

}

module.exports = Annie