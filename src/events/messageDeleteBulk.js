module.exports = function messageDeleteBulk(client, messages) {
    //  Ignore DM interface
    if (messages.channel.type === `dm`) return 
    const logs = client.guilds.cache.get(messages.channel.guild.id).configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(messages.channel.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`I'm not 100% positive who deleted those messages. But I've counted, there are total of ${messages.cache.size} messages that just got deleted from ${messages.channel}.`, {
        header: `There's a message wipeout`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
