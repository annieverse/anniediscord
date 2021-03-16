const shardName = require(`./config/shardName.json`)
module.exports = () => {
    const logger = require(`./libs/logger`)
    const { ShardingManager } = require('discord.js')
    const manager = new ShardingManager(`./src/annie.js`, { token: process.env.TOKEN })
    manager.on('shardCreate', shard => logger.info(`Shard ID:${shard.id}@${shardName[shard.id]} successfully launched.`))
    manager.spawn()
}