const winston = require(`../utils/config/winston`)
module.exports = (bot) => {
	bot.logger = winston
	bot.logger.info(`Reconnecting to the server,...`)
}
