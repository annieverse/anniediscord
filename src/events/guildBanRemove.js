module.exports = function guildBanRemove(client, guild, user) {
    const logs = guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`I'm happy to hear that ${user} is allowed to visit our place again! Yay! Thanks to the admin/moderator who has revoked their ban. <3`, {
        header: `Revoked punishment!`,
        thumbnail: user.displayAvatarURL(),
        timestampAsFooter: true
    }) 
    .catch(e => e)

}
