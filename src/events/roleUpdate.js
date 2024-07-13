module.exports = function roleUpdate(client, oldRole, newRole) {
    if (!client.isReady()) return
    if (!newRole.guild.configs) return

    const logs = newRole.guild.configs.get(`LOGS_MODULE`).value 
    if (!logs) return 
    const logChannel = client.getGuildLogChannel(newRole.guild.id)
    if (!logChannel) return 
    //  Perform logging to target guild
    client.responseLibs(logChannel, true)
    .send(`Hey look! our ${newRole} just got updated and looks more cute than before!<3 If you want to see which variables got changed, try check the audit logs in server setting!`, {
        header: `Ayee, refreshed role!♡`,
        timestampAsFooter: true
    }) 
    .catch(e => e)
}
