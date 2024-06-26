module.exports = function guildDelete(client, guild) {
    //  Perform logging to support server
    client.shard.broadcastEval((c,{g}) => c.channels.cache.has(`1021135246177079326`) ? c.channels.cache.get(`1021135246177079326`).send(`NODE_HAS_LEFT:: ${g.id}@${g.name}`) : c.channels.fetch(`1021135246177079326`).then(channel => channel.send(`NODE_HAS_LEFT:: ${g.id}@${g.name}`)).catch(err=>c.logger.error(err)), {context: {g:guild}})
}
