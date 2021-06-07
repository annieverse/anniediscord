module.exports = function messageDelete(client, message) {
    //  Ignore DM interface
    if (message.channel.type === `dm`) return 
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
