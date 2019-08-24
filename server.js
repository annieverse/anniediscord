//  Initialize startup modules
console.time(`Initialized In`)
const { Client } = require(`discord.js`)
let bot = new Client()
const modulesLoader = require(`./utils/modulesLoader`)
const express = require(`express`)
const app = express()

//	Ping server so it won't died cause of idling.
app.get(`/`, (request, response) => response.sendStatus(200))

//  To prevent PM2 from being terminated.
const listener = app.listen(process.env.PORT, () => console.log(`Port ${listener.address().port} OK`))

//	Loading command modules.
bot = new modulesLoader().register(bot)

//  Loads .env variables
require(`dotenv`).config()

//  Start events.
require(`./utils/eventHandler`)(bot)

//	Login.
bot.login(process.env.TOKEN)
