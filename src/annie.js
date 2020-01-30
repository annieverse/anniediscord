const Discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const commandsLoader = require(`./struct/commands/loader`)
const database = require(`./struct/database`)
const logger = require(`./struct/logger`)
const keyv = require(`keyv`)
const express = require(`express`)

module.exports = () => {

	try {
		
		/**
		 * 	-------------------------------------------------------------
		 *  Preparing server
		 *  -------------------------------------------------------------
		 */
		logger.info(ascii)
		logger.info(`> Initializing ${process.env.NODE_ENV} server...`)


		/**
		 * 	-------------------------------------------------------------
		 *  Registering Client.
		 *  TO-DO: split Client's parameters into its own config file.
		 *  -------------------------------------------------------------
		 */
		logger.info(`> Registering client...`)
		let Annie = new Discord.Client({ disableEveryone: true })
		Annie.startupInit = process.hrtime()


		/**
		 * 	-------------------------------------------------------------
		 *  Registering Custom Properties.
		 *  -------------------------------------------------------------
		 */
		logger.info(`> Registering nodes...`)
		Annie.logger = logger
		Annie.getBenchmark = (measure) => { return `${(measure[0] * 1000) + (measure[1] / 1e6)} ms` }
		Annie.locale = require(`./locales/default`)
		Annie.config = config
		Annie.keyv = new keyv()
		Annie.db = new database(null, Annie).connect()
		Annie = new commandsLoader().register(Annie)


		/**
		 * 	-------------------------------------------------------------
		 *  Start listening to server port and events
		 *  -------------------------------------------------------------
		 */
		require(`./events/eventHandler`)(Annie)
		const app = express()
		app.get(`/`, (request, response) => response.sendStatus(200))
		app.listen(config.port)
		logger.info(`> Listening to port ${config.port}...`)


		/**
		 * 	-------------------------------------------------------------
		 *  Logging in
		 *  -------------------------------------------------------------
		 */
		Annie.login(process.env.TOKEN)
		logger.info(`> Logging in...`)

	}
	catch(e) {
		return logger.error(`Client has failed to start.`)
	}
}