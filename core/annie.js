const discord = require(`discord.js`)
const config = require(`./config/global`)
const ascii = require(`./utils/config/startupAscii`)
const benchmark = require(`./utils/benchmarkConverter`)
const modulesLoader = require(`./utils/modulesLoader`)
const database = require(`./utils/databaseManager`)
const keyvClient = require(`keyv`)
const express = require(`express`)
const winston = require(`./utils/config/winston`)

module.exports = () => {

	//	Initialize client
	let bot = new discord.Client({ disableEveryone: true })
	bot.startupInit = process.hrtime()

	//	Custom splash text on dev environment's startup
	if (config.dev) winston.info(ascii)

	const app = express()
	app.get(`/`, (request, response) => response.sendStatus(200))
	app.listen(config.port)


	//	Assign Client custom props
	bot.code = require(`./utils/predefinedMessages`)
	bot.cards = require(`./utils/cards-metadata`)
	bot.getBenchmark = benchmark
	bot.logger = winston
	bot.config = config
	bot.db = new database(null, bot).connect()
	bot.keyv = new keyvClient()
	bot = new modulesLoader().register(bot)

	require(`./events/eventHandler`)(bot)
	bot.login(process.env.TOKEN)

}