const {InteractionType} = require(`discord.js`)
const applicationCommand = require(`../controllers/applicationCommand`)
module.exports = async(client, interaction) => {
    if (interaction.type != (InteractionType.ApplicationCommand)) return
    let command = client.application_commands.get(interaction.commandName)
        // Ignore non-registered commands
    if (!command) return
    applicationCommand(client, interaction, command)
}