"use strict"
const errorRelay = async (client, { fileName, error_message, error_stack, errorType, guildId, userId, targetCommand, providedArgs, levelZeroErrors }) => {
    /**
     * normal -> happens in a file like annie.js
     * txtcmd -> happens in relation to a command being ran and being a "text" command; for ex. >ping
     * appcmd -> happens in relation to a command being ran and being a "slash" (application) command; for ex. /ping
     */
    if (![`normal`, `txtcmd`, `appcmd`].includes(errorType)) return client.logger.error(`[errorRelay.js] errorType must equal normal, txtcmd, or appcmd > entered type: ${errorType}`)
    if (!fileName) return client.logger.error(`[errorRelay.js] fileName must be populated`)
    if (!error_message) return client.logger.error(`[errorRelay.js] error_message must be populated > ${fileName}`)
    if (!errorType) return client.logger.error(`[errorRelay.js] errorType must be populated > ${fileName}`)
    if (!levelZeroErrors) return client.logger.error(`[errorRelay.js] levelZeroErrors must be populated  > ${fileName}`)

    // Common Discord Errors
    const DiscordAPIError_50001 = `Missing Access`
    const DiscordAPIError_50013 = `Missing Permissions`
    const DiscordAPIError_50005 = `Cannot edit a message authored by another user`

    // Blacklist errors/Ignore errors
    const IgnoreErrorFilter = [DiscordAPIError_50013, DiscordAPIError_50001]
    if (IgnoreErrorFilter.includes(error_message)) return
    const internalError = `[Internal Error]`
    if (error_message.includes(internalError)) return

    // Create a Date Object to get current time
    const date = new Date()

    const DiscordAPIError_ThreadId = `1259908155597389865`
    const DiscordAPIError_50005_ThreadId = `1259907790483357736`
    const DiscordAPIError_50013_ThreadId = `1259906787231010816`
    const DiscordAPIError_50001_ThreadId = `1259907469853982750`
    const lvl1_ThreadId = `1259906979522936953`

    const cmdError = [`txtcmd`, `appcmd`].includes(errorType)
    const normalError = errorType == `normal`

    // Construct error message and prepare to send
    const ERROR_MESSAGE_RAW = {
        NORMAL: [
            `─────────────────☆～:;`,
            `**${fileName}**`,
            `**TIMESTAMP:** ${date}`,
            `**LOCAL_TIME:** <t:${Math.floor(date.getTime() / 1000)}:F>`,
            `**ISSUE_TRACE:** ${error_message}`,
            `**ISSUE_STACK:** ${error_stack}`,
            `─────────────────☆～:;`
        ]
    }

    if (cmdError) {
        const guild = await client.fetchGuildPreview(guildId)
        const user = await client.users.fetch(userId)
        const providedArguments = providedArgs.length > 0 ? `\`${providedArgs}\`` : `No arguments provided`

        // Command
        ERROR_MESSAGE_RAW.CMD = [
            `─────────────────☆～:;`,
            `**FILE OCCURANCE: ${fileName}**`,
            `**GUILD_ID:** ${guild.id} - ${guild.name}`,
            `**AFFECTED_USER:** ${user.id} - @${user.username}`,
            `**AFFECTED_CMD:** ${targetCommand}`,
            `**ARGUMENTS ${errorType == `appcmd` ? `(Raw data)` : ``}:** ${providedArguments}`,
            `**TIMESTAMP:** ${date}`,
            `**LOCAL_TIME:** <t:${Math.floor(date.getTime() / 1000)}:F>`,
            `**ISSUE_TRACE:** ${error_message}`,
            `─────────────────☆～:;`
        ]
    }

    const errorToSend = normalError ? ERROR_MESSAGE_RAW.NORMAL : ERROR_MESSAGE_RAW.CMD

    const ERROR_MESSAGE = {
        content: errorToSend.join(`\n`)
    }

    /**
     * construct partial params to use based on incoming error
     * threadId: the thread channel id
     * username: custom name to use for webhook username, if none provided defaults to original
     */
    const ERROR_PARAMS = {
        DiscordAPIError_50001: {
            threadId: DiscordAPIError_50001_ThreadId,
            username: `Missing access`
        },
        DiscordAPIError_50013: {
            threadId: DiscordAPIError_50013_ThreadId,
            username: `Missing Permissions`
        },
        DiscordAPIError_50005: {
            threadId: DiscordAPIError_50005_ThreadId,
            username: `APIError_50005`
        },
        DiscordAPIError: {
            threadId: DiscordAPIError_ThreadId,
            username: `APIError`
        },
        Other: {
            threadId: lvl1_ThreadId,
            username: `System Error Reports`
        }
    }

    // Default object to use
    let constructedErrorMsg = { ...ERROR_MESSAGE, ...ERROR_PARAMS.Other }

    // Test incoming error againts filter to send to apporiate channnel
    // Filter error to forum thread(s)
    switch (error_message) {
        case DiscordAPIError_50001:
            constructedErrorMsg = { ...ERROR_MESSAGE, ...ERROR_PARAMS.DiscordAPIError_50001 }
            break
        case DiscordAPIError_50013:
            constructedErrorMsg = { ...ERROR_MESSAGE, ...ERROR_PARAMS.DiscordAPIError_50013 }
            break
        case DiscordAPIError_50005:
            constructedErrorMsg = { ...ERROR_MESSAGE, ...ERROR_PARAMS.DiscordAPIError_50005 }
            break
        default:
            if (error_stack && error_stack.includes(`DiscordAPIError`)) {
                constructedErrorMsg = { ...ERROR_MESSAGE, ...ERROR_PARAMS.DiscordAPIError }
            }
            break
    }
    if (client.errorWebhook) return client.errorWebhook.send(constructedErrorMsg)
    return
}
module.exports = errorRelay