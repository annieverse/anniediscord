const {
    InteractionType
} = require(`discord.js`)
const applicationCommand = require(`../controllers/applicationCommand`)
module.exports = async (client, interaction) => {
    await client.db.databaseUtility.validateUserEntry(interaction.user.id, interaction.user.username)
    if (interaction.type === InteractionType.ApplicationCommand) {
        let command = client.application_commands.get(interaction.commandName)
        // Ignore non-registered commands
        if (!command) return
        
        applicationCommand(client, interaction, command)
    } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        let command = client.application_commands.get(interaction.commandName)
        // Ignore non-registered commands
        if (!command) return
        try {
            command.autocomplete(client, interaction)
        } catch (error) {
            client.logger.error(error)
        }
    } else if (interaction.type === InteractionType.MessageComponent){
        const modal = client.modals.get(interaction.customId)
        if (!modal) return new Error(`There is no code for this modal yet`)
        try {
            await modal.execute(interaction, client)
        } catch (error) {
            client.logger.error(error)
        }
    }


}