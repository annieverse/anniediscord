const Discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./struct/commands/loader`)
const Database = require(`./struct/database`)
const logger = require(`./struct/logger`)
const Keyv = require(`keyv`)
const Express = require(`express`)
const locale = require(`./locales/default`)
const getBenchmark = require(`./utils/getBenchmark`)

class Annie extends Discord.Client {
	constructor() {
		super({ disableEveryone: true })
		this.startupInit = process.hrtime()
		this.benchmark = getBenchmark
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
			process.on(`unhandledRejection`, err => {
				logger.error(`Promise Rejection > ${err.stack}`)
			})

			logger.debug(ascii.default)
			logger.info(`Initializing ${process.env.NODE_ENV} server...`)

			// Connecting to .sqlite file in .data/database.sqlite
			await this._setupDatabase()
			// Registering all the available commands from ./src/commands directory
			await this._setupCommands()
			// Listening to default port
			this._listeningToPort(this.config.port)
			// Listening to discordjs events
			require(`./events/eventHandler`)(this)

			// Logging in and trigger events/ready.js
			logger.info(`Logging in...`)
			this.login(process.env.TOKEN)
		}
		catch(error) {
			logger.error(`Client terminated > ${error.stack}`)
		}
	}

	
	/**
	 * @desc This method has eliminated some of processes such as database connection
	 * and commands loader to reduce the client load.
	 * Intentionally made for fun and internal monitoring without reachable interactions as end user.
	 */
	minimal() {
		try {
			logger.info(ascii.minimalist)
			logger.info(`Initializing ${process.env.NODE_ENV} server...`)
			logger.info(`Logging in...`)
			this.login(process.env.TOKEN)
		}
		catch(error) {
			return logger.error(`Client terminated > ${error.stack}`)
		}
	}


	async _setupDatabase() {
		const dbtime = process.hrtime()
		const db = await new Database().connect()
		await db.schemaCheck()
		// Assign once successful
		this.db = db
		logger.info(`Database connected (${getBenchmark(dbtime)})`)
	}


	async _setupCommands() {
		const cmdtime = process.hrtime()
		this.commands = await new CommandsLoader().default()
		logger.info(`${this.commands.totalFiles} commands registered (${getBenchmark(cmdtime)})`)
	}


	_listeningToPort(port=0) {
		const app = Express()
		app.get(`/`, (request, response) => response.sendStatus(200))
		app.listen(port)
		logger.info(`Listening to port ${port}`)
	}


}

module.exports = Annie