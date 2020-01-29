module.exports = (bot, err) => {
	bot.logger.error(`${err.stack}`)
}
