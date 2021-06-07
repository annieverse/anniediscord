const commanifier = require(`../utils/commanifier`)
const Topgg = require(`@top-gg/sdk`)
const Reminder = require(`../libs/reminder`)
/**
 * Ready event.
 * @param {Client} annie Current bot/worker instance.
 * @return {void}
 */
module.exports = function ready(annie) {
    annie.registerNode(new Reminder(annie), `reminders`)
    annie.registerGuildConfigurations()
    annie.registerGuildAutoResponders()
    annie.logger.info(`<DEPLOYED> (${annie.getBenchmark(annie.startupInit)})`)
	if (annie.dev) return annie.user.setStatus(`dnd`)
    /**
     * 	--------------------------------------------------
     * 	Configuration for Production
     * 	--------------------------------------------------
     */
    annie.user.setStatus(`online`)
    annie.user.setActivity(`${annie.prefix}help`, {type: `WATCHING`})
    annie.logger.info(`successfully logged in (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
    //  Registering vote api into client property.
    annie.registerNode(new Topgg.Api(process.env.DBLTOKEN), `dblApi`)
}
