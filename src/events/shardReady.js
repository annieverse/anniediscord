const { ActivityType } = require(`discord.js`)
module.exports = function shardReady(annie, id, unavailableGuilds) {
    annie.logger.info(`Shard ${id} is ready!`)
    annie.logger.info(`Unavailable guilds: ${unavailableGuilds}`)
    // Set the bot status to online after 1 minute.
    setTimeout(()=>{
        annie.logger.info(`status changing for Shard ${id}`)
        if (annie.dev) return annie.user.setPresence({ activities: []})
        annie.user.setPresence({ activities: [{ name: `annie.gg`, type: ActivityType.Playing}], status: `online` })
    }, 60*1*1000)
    
}