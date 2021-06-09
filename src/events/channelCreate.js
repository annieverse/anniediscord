module.exports = function channelCreate(client, channel) {
    if (channel.type === `dm`) return
    if (!channel.guild.configs) return
    const logs = channel.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(channel.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Whoa, new room! a new channel named **${channel.name}** just created in our place! Can I play there? can I?`, {
        header: `New Channel!`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
