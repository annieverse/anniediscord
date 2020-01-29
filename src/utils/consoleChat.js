
const consoleChat = (bot = {}) => {
	let y = process.openStdin()
	y.addListener(`data`, res => {
		let x = res.toString().trim().split(/ +/g)
		let msg = x.join(` `)
		bot.channels.get(`577121315970875393`).send(msg)
	})
}

module.exports = consoleChat