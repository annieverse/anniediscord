module.exports = function roleUpdate(annie, id, unavailableGuilds) {
    annie.logger.info(`Shard ${id} is ready!`)
    annie.logger.info(`Unavailable guilds: ${unavailableGuilds}`)
    // Set the bot status to online after 1 minute.
    setTimeout(()=>{
        annie.logger.info(`status changing for Shard ${id}`)
        if (annie.dev) return
        annie.user.setStatus(`online`)
        annie.user.setActivity(`${annie.prefix}help | annie.gg`, { type: `PLAYING` })
    }, 60*1*1000)
    
}