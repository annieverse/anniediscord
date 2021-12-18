module.exports = function emojiCreate(client, emoji) {
    if (!emoji.guild.configs) return
    const logs = emoji.guild.configs.get(`LOGS_MODULE`).value
    if (!logs) return
    const logChannel = client.getGuildLogChannel(emoji.guild.id)
    if (!logChannel) return
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
        .send(`No more boring chat, now we got this shiny emoji to brighten our day! ${emoji}`, {
            header: `Look, a new emoji!♡`,
            timestampAsFooter: true
        })
        .catch(e => e)
}