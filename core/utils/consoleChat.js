
const consoleChat = (bot = {}) => {
	let y = process.openStdin()
	y.addListener(`data`, res => {
		let x = res.toString().trim().split(/ +/g)
		let msg = x.join(` `)
		let channel = `sandbox`
		bot.channels.get(bot.channels.find(x => x.name === channel).id).send(msg)
	})
}

module.exports = consoleChat