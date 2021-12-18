module.exports = function emojiDelete(client, emoji) {
       if (!emoji.guild.configs) return
 const logs = emoji.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(emoji.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`This precious ${emoji} emoji just got banished from our place. :(`, {
        header: `Ops, baibai emoji...`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
