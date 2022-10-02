module.exports = function messageDeleteBulk(client, messages, channel) {
    if (!channel) return
    if (!channel.guild) return
    const cfg = client.guilds.cache.get(channel.guild.id).configs
    if (!cfg) return
    //  Ignore DM interface
    const logs = cfg.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(channel.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`I'm not 100% positive who deleted those messages. But I've counted, there are total of ${messages.size} messages that just got deleted from ${channel}.`, {
        header: `There's a message wipeout`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
