module.exports = function guildDelete(client, guild) {
    //  Perform logging to support server
    client.shard.broadcastEval(`this.channels.cache.has('724732289572929728') ? this.channels.cache.get('724732289572929728').send('NODE_HAS_LEFT:: ${guild.id}@${guild.name}') : null`)
}
