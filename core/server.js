module.exports = () => {
	//  Initialize startup modules
	console.time(`Initialized In`)
	const { Client } = require(`discord.js`)
	let bot = new Client()
	const modulesLoader = require(`./utils/modulesLoader`)
	const express = require(`express`)
	const app = express()
	const http = require(`http`)
	http.createServer((req, res) => {
	res.writeHead(200, {
		'Content-type': `text/plain`
	})
		res.write(`Hey`)
		res.end()
	}).listen(4000)
    
	//  Loads .env variables
	require(`dotenv`).config()

	//	Ping server so it won't died cause of idling.
	app.get(`/`, (request, response) => response.sendStatus(200))

	//  To prevent PM2 from being terminated.
	app.listen(process.env.PORT)
    
	//	Loading command modules.
	bot = new modulesLoader().register(bot)

	//  Start events.
	require(`./utils/eventHandler`)(bot)

	//	Login.
	bot.login(process.env.TOKEN)

}