module.exports = () => {

	const environment = require(`../.data/environment`)
	const ascii = require(`./utils/config/startupAscii`)
	const benchmark = require(`./utils/benchmarkConverter`)
	const modulesLoader = require(`./utils/modulesLoader`)
	const Database = require(`./utils/databaseManager`)
	const KeyvClient = require(`keyv`)
	const express = require(`express`)
	const winston = require(`./utils/config/winston`)
	const cards = require(`./utils/cards-metadata`)
	const msgCodes = require(`./utils/predefinedMessages`)
	const cmd = require(`node-cmd`)
	const { dependencies } = require(`../package`)


	//	Handling incompatible version of canvas.
	if (!environment.dev) {
		if (!dependencies.canvas.includes(`2.0.0-alpha.2`)) {
			winston.info(`Incompatible version of canvas has been detected in the production, fallback version will be installed in a moment.`)
			return cmd.run(`
				npm install canvas@2.0.0-alpha.2
			`)
		}
	}

	
	//Initialize startup modules
	const { Client } = require(`discord.js`)
	let bot = new Client()
	bot.startupInit = process.hrtime()
	const app = express()

	
	if (environment.dev) winston.info(ascii)


	require(`dotenv`).config()
	app.get(`/`, (request, response) => response.sendStatus(200))
	app.listen(process.env.PORT)


	//	Initialize @Client custom props
	bot.code = msgCodes
	bot.cards = cards
	bot.getBenchmark = benchmark
	bot.logger = winston
	bot.env = environment
	bot.db = new Database(null, bot).connect()
	bot.keyv = new KeyvClient()
	bot = new modulesLoader().register(bot)


	require(`./utils/eventHandler`)(bot)
	bot.login(process.env.TOKEN)

}