const { ApplicationCommandType, PermissionFlagsBits } = require(`discord.js`)
    /**
     * List of servers that supporting the development of Annie.
     * @author Pan
     */
module.exports = {
        name: `removeallreactions`,
        aliases: [],
        description: `Remove all reactions on a message`,
        usage: `removeallreactions`,
        permissionLevel: 0,
        multiUser: false,
        applicationCommand: true,
        messageCommand: false,
        type: ApplicationCommandType.Message,
        default_member_permissions: PermissionFlagsBits.AddReactions.toString(),
        async Iexecute(client, reply, interaction, options, locale) {
            const messageToRemoveAllReactionsFrom = interaction.targetMessage
            const possibleReactions = messageToRemoveAllReactionsFrom.reactions
            const action = possibleReactions.removeAll().then((c)=> reply.send(`I have removed all possible reactions from message with id: ${c.id}`, {ephemeral: true})).catch((error)=>client.logger.error(`[removeAllReactions.js] error: ${error.stack}`))
            return 
        }
}