module.exports = function guildBanAdd(client, guild, user) {
    if (!guild.configs) return
    const logs = guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Have you heard the recent news? I got told that ${user} just got banned from our place. What an unfortunate blob.`, {
        header: `Someone got banned!`,
        thumbnail: user.displayAvatarURL(),
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
