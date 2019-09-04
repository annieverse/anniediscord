module.exports = () => {
	
	//  Initialize startup modules
	const { Client } = require(`discord.js`)
	let bot = new Client()
	const modulesLoader = require(`./utils/modulesLoader`)
	const Database = require(`./utils/databaseManager`)
	const KeyvClient = require(`keyv`)
	const express = require(`express`)
	const app = express()

	
	//  Loads .env variables
	require(`dotenv`).config()

	//	Ping server so it won't died cause of idling.
	app.get(`/`, (request, response) => response.sendStatus(200))

	//  To prevent PM2 from being terminated.
	app.listen(process.env.PORT)

	//	Initialize logger
	bot.logger = require(`./utils/config/winston`).loggers.get(`main`)

	//	Initializing db connection
	bot.db = new Database().connect()

	//	Initialize in-memory keyv
	bot.keyv = new KeyvClient()

	//	Initialize environment config
	bot.env = require(`../.data/environment`)

	//	Loading command modules.
	bot = new modulesLoader().register(bot)

	//  Start events.
	require(`./utils/eventHandler`)(bot)

	//	Login.
	bot.login(process.env.TOKEN)

}