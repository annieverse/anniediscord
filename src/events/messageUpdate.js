module.exports = function messageUpdate(client, oldMessage, newMessage) {
    //  Ignore DM interface
    if (oldMessage.channel.type === `dm`) return 
    if (!oldMessage.guild.configs) return
    const logs = newMessage.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(newMessage.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Your detective Annie is here. I saw someone named ${newMessage.author} just updated their message in ${newMessage.channel}.\n**From this →** ${oldMessage.content}\n**To this one →** ${newMessage.content}`, {
        header: `A message just got updated!`,
        thumbnail: newMessage.author.displayAvatarURL(),
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
