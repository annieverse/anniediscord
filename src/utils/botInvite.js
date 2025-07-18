//const { PermissionFlagsBits, OAuth2Scopes } = require(`discord.js`)
/**
* Client/Bot invite generator.
* @param {Client} client Current client instancee.
* @return {string}
*/
const getBotInviteUrl = (client) => {
    const staticLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=139855260672&scope=applications.commands%20bot`
    /*
    const link = client.generateInvite({
        permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.UseExternalStickers,
            PermissionFlagsBits.ManageMessages
        ],
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    })
    */
    return staticLink
}
module.exports = getBotInviteUrl