const Topgg = require(`@top-gg/sdk`)
const Reminder = require(`../libs/reminder`)
/**
 * Ready event.
 * @param {Client} annie Current bot/worker instance.
 * @return {void}
 */
module.exports = function ready(annie) {
    annie.db.initializeDb()
    annie.registerNode(new Reminder(annie), `reminders`)
    annie.registerGuildConfigurations()
    annie.registerGuildAutoResponders()
    annie.registerUserDurationalBuffs()
    annie.logger.info(`<DEPLOYED> (${annie.getBenchmark(annie.startupInit)})`)
    if (annie.dev) return annie.user.setPresence({status: `dnd` })
    /**
     * 	--------------------------------------------------
     * 	Configuration for Production
     * 	--------------------------------------------------
     */
    annie.logger.info(`successfully logged in (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
    //  Registering vote api into client property.
    annie.registerNode(new Topgg.Api(process.env.DBLTOKEN), `dblApi`)
}
