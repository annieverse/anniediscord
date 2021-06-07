module.exports = function guildDelete(client, guild) {
    //  Limit logging utility to support server only
    if (guild.id !== client.supportServerId) return 
    const logs = guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`All those sweet memories we've spent together just vanished like that. I know I'm not perfect, but I do hope that someday they will invite me again. </3`, {
        header: `${guild.name}@${guild.id}`,
        thumbnail: guild.iconURL()
    }) 
    .catch(e => e)
}
