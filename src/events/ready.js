const commanifier = require(`../utils/commanifier`)
const Routines = require(`../libs/routines`)
const Topgg = require(`@top-gg/sdk`)

module.exports = annie => {
	//  Run configurations once
	const Routine = new Routines(annie)
    const instanceId = `[SHARD_ID:${annie.shard.ids[0]}@EVENT_READY]`
	if (annie.startupState) {
		annie.startupState = false
        annie.registerReminders()
		annie.registerGuildConfigurations()
		annie.registerGuildAutoResponders()
	}
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
		//  Cache cancel button into shard
		annie.logger.info(`${instanceId} successfully logged in (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		annie.user.setStatus(`online`)
		setInterval(() => {
			annie.shard.broadcastEval(`this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)`)
			.then(res => {
				const pools = [`${commanifier(res.reduce((acc, memberCount) => acc + memberCount, 0))} users`, `${annie.prefix}help`]
				annie.user.setActivity(pools[Math.floor(Math.random() * pools.length)], {type: `WATCHING`})
			})
		//  Refresh activity for every 60 seconds
		}, 60000)
		//  Registering vote api into client property.
		annie.registerNode(new Topgg.Api(process.env.DBLTOKEN), `dblApi`)
	}
}
