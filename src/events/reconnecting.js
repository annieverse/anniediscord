const winston = require(`../libs/logger`)
module.exports = (bot) => {
	bot.logger = winston
	bot.logger.info(`Reconnecting to the server,...`)
}
