module.exports = function channelDelete(client, channel) {
    if (channel.type === `dm`) return
    if (!channel.guild.configs) return
    const logs = channel.guild.configs.get(`LOGS_MODULE`).value
    if (!logs) return
    const logChannel = client.getGuildLogChannel(channel.guild.id)
    if (!logChannel) return
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
        .send(`Rest in peace,. **${channel.name}**. I'll always remember all the memories we made in that channel. :(`, {
            header: `Channel just got deleted...`,
            timestampAsFooter: true
        })
        .catch(e => e)
}