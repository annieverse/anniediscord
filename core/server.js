module.exports = () => {
	
	//  Initialize startup modules
	console.time(`Initialized In`)
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
    
	//	Loading command modules.
	bot = new modulesLoader().register(bot)

	//	Initializing db connection
	bot.db = new Database().connect()

	//	Initialize in-memory keyv
	bot.keyv = new KeyvClient()

	//	Initialize logger
	bot.logger = require(`./utils/config/winston`)

	//	Initialize environment config
	bot.env = require(`../.data/environment`)

	//  Start events.
	require(`./utils/eventHandler`)(bot)

	//	Login.
	bot.login(process.env.TOKEN)

}