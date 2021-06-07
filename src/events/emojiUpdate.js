module.exports = function emojiUpdate(client, oldEmoji, newEmoji) {
    const logs = newEmoji.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(newEmoji.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Ooh, look here,. our ${newEmoji} emoji's name just got updated from **${oldEmoji.name}** to **${newEmoji.name}**! For what reason? no one knows..`, {
        header: `Refreshed emoji!♡`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
