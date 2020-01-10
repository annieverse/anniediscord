module.exports = () => {

	const { Client } = require(`discord.js`)
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
	
	//	Initialize client
	let bot = new Client()
	bot.startupInit = process.hrtime()
	const app = express()

	//	Custom splash text on dev environment's startup
	if (environment.dev) winston.info(ascii)

	//	Only deletes .git history on prod environment
	if (!environment.dev) {
		cmd.run(`rm -rf .git`)
		winston.info(`cleaning up .git history`)
	}

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