const commanifier = require(`../utils/commanifier`)
const VotesManager = require(`../libs/votes`)
const Routines = require(`../libs/routines`)

module.exports = annie => {
	//  Run configurations once
	const Routine = new Routines(annie)
	if (annie.startupState) {
		annie.startupState = false
		annie.registerGuildConfigurations()
		annie.registerReminders()
		annie.registerGuildAutoResponders()
	}
	if (annie.dev) {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Development
		 * 	--------------------------------------------------
		 */
		annie.shard.broadcastEval(`this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)`)
		.then(res => {
			annie.logger.info(`${annie.user.username}@${annie.user.id} has been deployed (${annie.getBenchmark(annie.startupInit)})`)
			annie.logger.info(`currently serving ${res.reduce((acc, memberCount) => acc + memberCount, 0)} users`)
			annie.user.setStatus(`dnd`)
		})
	} else {
		/**
		 * 	--------------------------------------------------
		 * 	Configuration for Production
		 * 	--------------------------------------------------
		 */
		//  Cache cancel button into shard
		annie.logger.info(`Successfully logged in. (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
		annie.user.setStatus(`online`)
		setInterval(() => {
			annie.shard.broadcastEval(`this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)`)
			.then(res => {
				const pools = [`${commanifier(res.reduce((acc, memberCount) => acc + memberCount, 0))} users`, `${annie.prefix}help`]
				annie.user.setActivity(pools[Math.floor(Math.random() * pools.length)], {type: `WATCHING`})
			})
		//  Refresh activity for every 60 seconds
		}, 60000)
		/**
		 * 	--------------------------------------------------
		 * 	Primary task
		 * 	--------------------------------------------------
		 */
		//	Recording resource usage every 5 mins
		Routine.resourceUsageLogging()
		//	Check if pixiv cache's dir exists or not
		Routine.pixivCacheDirCheck()
		Routine.releasePixivCaches()
		//  Handling incoming votes
		new VotesManager(annie)
	}
}
