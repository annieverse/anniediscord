const dataCleaner = require(`../../libs/dataCleanup.js`)
module.exports = async function guildCreate(client, guild) {
    if (!client.isReady()) return
    client.db.guildUtils.registerGuild(guild)
    client.registerGuildConfigurations(guild.id)
    //  Notify owner of the server.
    const owner = await client.users.fetch(guild.ownerId)
    client.responseLibs(owner, true)
        .send(`**hello!♡** thanks for inviting me to your server!\nto get your started, type **\`${client.prefix}help\`** in the server to see all my available commands. \n\nbut for further informations, you can try ask it directly to the developers at link below. ${await client.getEmoji(`AnnieHeartHug`)}\n[join my support server!](${client.supportServer})`, {
            image: `banner_help`
        })
        .catch(e => e)
    const cleaner = new dataCleaner(client)
    cleaner.umarkForDeletion(guild.id)
}
