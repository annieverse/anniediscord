module.exports = () => {
	
	//  Initialize startup modules
	const { Client } = require(`discord.js`)
	let bot = new Client()
	bot.startupInit = process.hrtime()
	const ascii = require(`./utils/config/startupAscii`)
	const benchmark = require(`./utils/benchmarkConverter`)
	const modulesLoader = require(`./utils/modulesLoader`)
	const Database = require(`./utils/databaseManager`)
	const KeyvClient = require(`keyv`)
	const express = require(`express`)
	const environment = require(`../.data/environment`)
	const winston = require(`./utils/config/winston`)
	const app = express()

	
	if (environment.dev) winston.info(ascii)


	require(`dotenv`).config()
	app.get(`/`, (request, response) => response.sendStatus(200))
	app.listen(process.env.PORT)


	//	Initialize @Client custom props
	bot.getBenchmark = benchmark
	bot.logger = winston
	bot.env = environment
	bot.db = new Database(null, bot).connect()
	bot.keyv = new KeyvClient()
	bot = new modulesLoader().register(bot)


	require(`./utils/eventHandler`)(bot)
	bot.login(process.env.TOKEN)

}