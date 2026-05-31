"use strict"
const { InteractionType } = require(`discord.js`)
const applicationCommand = require(`../../controllers/applicationCommand`)
const errorRelay = require(`../../utils/errorHandler.js`)
module.exports = async (client, interaction) => {
    if (!client.isReady()) return
    await client.db.databaseUtils.validateUserEntry(interaction.user.id, interaction.user.username)
    const userData = await client.db.userUtils.getUserLocale(interaction.user.id)
    client.localization.lang = userData.lang
    const locale = (key) => client.localization.findLocale(key)
    const reply = client.responseLibs(interaction, true, locale)
    try {
        //  Build a per-interaction lookup so guild-only commands never leak into
        //  the shard-global `client.application_commands` singleton. Reassigning the
        //  singleton (the old behavior) accumulated every guild's guild-only commands
        //  process-wide, contaminating later lookups across guilds.
        const lookup = client.guildonly_commands.has(interaction.guildId)
            ? client.application_commands.concat([...client.guildonly_commands.get(interaction.guildId)])
            : client.application_commands
        if (interaction.type === InteractionType.ApplicationCommand) {
            let command = lookup.get(interaction.commandName)
            // Ignore non-registered commands
            if (!command) return

            applicationCommand(client, interaction, command)
        } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            let command = lookup.get(interaction.commandName)
            // Ignore non-registered commands
            if (!command) return
            command.autocomplete(client, interaction)
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
        const guildId = interaction.guildId || `DM/Unknown`
        const userId = interaction.user.id || `Unknown`
        const data = interaction.options.data || []
        const targetCommand = interaction.commandName || `Unknown`
        const errorMsg = err.message || `Unknown Error`
        errorRelay(client, { fileName: `interactionCreate.js`, errorType: `appcmd`, guildId: guildId, userId: userId, providedArgs: JSON.stringify(data), error_message: errorMsg, targetCommand: targetCommand }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    }
}