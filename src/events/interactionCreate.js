const {
    InteractionType
} = require(`discord.js`)
const levelZeroErrors = require(`../utils/errorLevels.js`)
const applicationCommand = require(`../controllers/applicationCommand`)
const errorRelay = require(`../utils/errorHandler.js`)
module.exports = async (client, interaction) => {
    if (!client.isReady()) return
    await client.db.databaseUtils.validateUserEntry(interaction.user.id, interaction.user.username)
    const userData = await client.db.userUtils.getUserLocale(interaction.user.id)
    // const locale = client.getTargetLocales(userData.lang)
    client.localization.lang = userData.lang
    const locale = (key) => client.localization.findLocale(key)
    const reply = client.responseLibs(interaction, true, locale)
    try {
        if (client.guildonly_commands.has(interaction.guildId)) {
            let guildonlycommands = client.guildonly_commands.get(interaction.guildId)
            client.application_commands = client.application_commands.concat([...guildonlycommands])
        }
        if (interaction.type === InteractionType.ApplicationCommand) {
            let command = client.application_commands.get(interaction.commandName)
            // Ignore non-registered commands
            if (!command) return

            applicationCommand(client, interaction, command)
        } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            let command = client.application_commands.get(interaction.commandName)
            // Ignore non-registered commands
            if (!command) return
            command.autocomplete(client, interaction)
        } else if (interaction.type === InteractionType.MessageComponent) {
            const modal = client.modals.get(interaction.customId)
            if (!modal) return new Error(`There is no code for this modal yet`)
            await modal.execute(interaction, client)
        }
    } catch (err) {
        client.logger.error(err)
        if (client.dev) return await reply.send(locale(`ERROR_ON_DEV`), {
            socket: {
                error: err.stack,
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        await reply.send(locale(`ERROR_ON_PRODUCTION`), {
            socket: { emoji: await client.getEmoji(`AnniePout`) },
            ephemeral: true
        }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        errorRelay(client, { fileName: `interactionCreate.js`, errorType: `appcmd`, guildId: interaction.guildId, userId: interaction.user.id, providedArgs: JSON.stringify(interaction.options.data), error_message: err.message, targetCommand: interaction.commandName, levelZeroErrors: levelZeroErrors }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    }
}