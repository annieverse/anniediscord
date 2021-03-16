const shardName = require(`./config/shardName.json`)

/**
 *  Parse shard name for given shard id.
 *  @param {number} id
 *  @return {string}
 */
const getCustomShardId = (id) => {
    return `SHARD_ID:${id} | ${shardName[id]}`
}

module.exports = () => {
    const logger = require(`./libs/logger`)
    const { ShardingManager } = require(`discord.js`)
    const manager = new ShardingManager(`./src/annie.js`, { token: process.env.TOKEN })
    manager.on(`shardCreate`, shard => logger.info(`${getCustomShardId(shard.id)} successfully launched.`))
    manager.spawn()
}