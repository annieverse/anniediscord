module.exports = function messageDelete(client, message) {
    if (!client.isReady()) return
    //  Ignore DM interface
    if (message.channel.type === `dm`) return 
    if (!message.guild.configs) return
    if (message.author.bot || message.author.id === message.client.user.id) return    
    const logs = message.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(message.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Hi! It seems someone named ${message.author} just deleted their message from ${message.channel}.\nIf I could recall, the message was like '${message.content}'`, {
        header: `Someone deleted their message?`,
        thumbnail: message.author.displayAvatarURL(),
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
