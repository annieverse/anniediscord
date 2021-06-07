module.exports = function roleCreate(client, role) {
    const logs = role.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(role.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`I noticed an admin/moderator just made a new role named ${role}! Looks cute isn't? I can't wait to see who gonna be the first one receiving this role!♡`, {
        header: `Yay, new role!♡`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
