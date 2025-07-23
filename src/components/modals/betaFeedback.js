const {
    ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags
} = require(`discord.js`)
module.exports = {
    data: {
        name: `betaFeedback`
    },
    async execute(interaction, client) {
        // Create the cooldown for the command so a user cant start two instances of the command
        const sessionID = `FEEDBACK:${interaction.member.id}`
        if (await client.db.databaseUtils.doesCacheExist(sessionID)) return interaction.reply({ content: `I'm sorry but you have recently sent feedback already`, flags: MessageFlags.Ephemeral })
        client.db.databaseUtils.setCache(sessionID, `1`, { EX: 60 * 5 })

        const customID = `${interaction.customId}_${interaction.applicationId}_${interaction.user.id}_${Date.now()}`
        const modal = new ModalBuilder().setCustomId(customID).setTitle(`Beta feature Feedback`)
        const commandNameInput = new TextInputBuilder()
            .setCustomId(`feature`)
            // The label is the prompt the user sees for this input
            .setLabel(`What command is this in relation to?`)
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        const feedbackInput = new TextInputBuilder()
            .setCustomId(`feedbackAnswer`)
            // The label is the prompt the user sees for this input
            .setLabel(`Any feedback you would like to give?`)
            // Short means only a single line of text
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        modal.addComponents(new ActionRowBuilder().addComponents(commandNameInput), new ActionRowBuilder().addComponents(feedbackInput))
        await interaction.showModal(modal)
        const filter = (i) => i.customId === customID

        let modalResponse
        try {
            modalResponse = await interaction.awaitModalSubmit({ filter, time: 60000 })
        } catch (error) {
            client.db.databaseUtils.delCache(sessionID)
            client.logger.error(`Error has been handled\n${error}`)
        }
        if (!modalResponse) return // exit if modal is cancelled
        modalResponse.reply({ content: `Thank you for submitting feedback`, flags: MessageFlags.Ephemeral })

        // Fetch the support guild and channel the message needs to be sent to, then forward on the message
        const guild = await client.guilds.fetch(`577121315480272908`)
        const guildChannel = await guild.channels.fetch(`1070131212397592586`)
        guildChannel.send({ content: `**Beta feature:** ${modalResponse.fields.getTextInputValue(`feature`)}\n**User Feedback** (${modalResponse.member.user.tag} | ${modalResponse.member.id}): ${modalResponse.fields.getTextInputValue(`feedbackAnswer`)}` })

    }
}