const commanifier = require(`../utils/commanifier`)
const Topgg = require(`@top-gg/sdk`)

module.exports = annie => {
	//  Run configurations once
    const instanceId = `[SHARD_ID:${annie.shard.ids[0]}@EVENT_READY]`
    annie.registerReminders()
    annie.registerGuildConfigurations()
    annie.registerGuildAutoResponders()
	if (annie.dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
        annie.logger.info(`${instanceId} has been deployed (${annie.getBenchmark(annie.startupInit)})`)
        annie.user.setStatus(`dnd`)
	} else {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		annie.logger.info(`${instanceId} successfully logged in (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		annie.user.setStatus(`online`)
		annie.user.setActivity(`${annie.prefix}help`, {type: `WATCHING`})
		//  Registering vote api into client property.
		annie.registerNode(new Topgg.Api(process.env.DBLTOKEN), `dblApi`)
	}
}
