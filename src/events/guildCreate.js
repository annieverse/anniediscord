module.exports = function guildCreate(client, guild) {    
    client.db.registerGuild(guild)
    client.registerGuildConfigurations(guild.id)
    //  Limit logging utility to support server only
    if (guild.id !== client.supportServerId) return
    const logs = guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Look! a new guild just invited me to their server! I'm so happy! Let's strive for the best!♡`, {
        header: `${guild.name}@${guild.id}`,
        thumbnail: guild.iconURL()
    }) 
    .catch(e => e)
}
