module.exports = async(client, interaction) => {
    if (!interaction.isCommand()) return
    const command = client.commands.get(interaction.commandName)

    if (!command) return

    try {
        await command.Iexecute(interaction)
    } catch (err) {
        if (err) client.logger.error(err)

        await interaction.reply({
            content: `An error occured while trying to process that command`,
            ephemeral: true
        })
    }
}