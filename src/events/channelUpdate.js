module.exports = function channelUpdate(client, oldChannel, newChannel) { 
    if (newChannel.type === `dm`) return
    if (!newChannel.guild.configs) return
    const logs = newChannel.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(newChannel.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Yay, our **${newChannel.name}** channel just got updated! I wonder how it looks now? hmmm..`, {
        header: `Refreshed Channel!♡"`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
