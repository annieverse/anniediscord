"use strict"
const errorRelay = async (client, { fileName, error_message, error_stack, errorType, guildId, userId, targetCommand, providedArgs, levelZeroErrors }) => {
    /**
     * 1 = normal
     * 2 = text command
     * 3 = application command
     */
    if (![`normal`, `txtcmd`, `appcmd`].includes(errorType)) return client.logger.error(`[errorRelay.js] errorType must equal normal, txtcmd, or appcmd > entered type: ${errorType}`)
    if (!fileName) return client.logger.error(`[errorRelay.js] fileName must be populated`)
    if (!error_message) return client.logger.error(`[errorRelay.js] error_message must be populated > ${fileName}`)
    if (!errorType) return client.logger.error(`[errorRelay.js] errorType must be populated > ${fileName}`)
    if (!levelZeroErrors) return client.logger.error(`[errorRelay.js] levelZeroErrors must be populated  > ${fileName}`)
    // Create a Date Object to get current time
    const date = new Date()

    // Test incoming error againts filter to send to apporiate channnel
    const lvl0Test = levelZeroErrors.includes(error_message)

    // Test if Client has the guild
    const lvl0ChanlId = `797521371889532988`
    const lvl1ChanlId = `848425166295269396`

    const DiscordAPIError_ThreadId = `1259908155597389865`
    const DiscordAPIError_50005_ThreadId = `1259907790483357736`
    const DiscordAPIError_50013_ThreadId = `1259906787231010816`
    const DiscordAPIError_50001_ThreadId = `1259907469853982750` 
    const lvl1_ThreadId = `1259906979522936953`

    const DiscordAPIError_Thread_Test = client.channels.cache.has(DiscordAPIError_ThreadId)
    const DiscordAPIError_50005_Thread_Test = client.channels.cache.has(DiscordAPIError_50005_ThreadId)
    const DiscordAPIError_50013_Thread_Test = client.channels.cache.has(DiscordAPIError_50013_ThreadId)
    const DiscordAPIError_50001_Thread_Test = client.channels.cache.has(DiscordAPIError_50001_ThreadId)
    const lvl1_ThreadTest = client.channels.cache.has(lvl1_ThreadId)
    const lvl1ChanCacheTest = client.channels.cache.has(lvl1ChanlId)
    const lvl0ChanCacheTest = client.channels.cache.has(lvl0ChanlId)

    if (!lvl1ChanCacheTest) await client.channels.fetch(lvl1ChanlId)
    if (!lvl0ChanCacheTest) await client.channels.fetch(lvl0ChanlId)

    if (!DiscordAPIError_Thread_Test) await client.channels.fetch(DiscordAPIError_ThreadId)
    if (!DiscordAPIError_50005_Thread_Test) await client.channels.fetch(DiscordAPIError_50005_ThreadId)
    if (!DiscordAPIError_50013_Thread_Test) await client.channels.fetch(DiscordAPIError_50013_ThreadId)
    if (!DiscordAPIError_50001_Thread_Test) await client.channels.fetch(DiscordAPIError_50001_ThreadId)
    if (!lvl1_ThreadTest) await client.channels.fetch(lvl1_ThreadId)

    // Filtered error channels
    const DiscordAPIError_Thread = client.channels.cache.get(DiscordAPIError_ThreadId)
    const DiscordAPIError_50005_Thread = client.channels.cache.get(DiscordAPIError_50005_ThreadId)
    const DiscordAPIError_50013_Thread = client.channels.cache.get(DiscordAPIError_50013_ThreadId)
    const DiscordAPIError_50001_Thread = client.channels.cache.get(DiscordAPIError_50001_ThreadId)
    const lvl1_Thread = client.channels.cache.get(lvl1_ThreadId)

    // Old all error channels
    const lvl0Channel = client.channels.cache.get(lvl0ChanlId)
    const lvl1Channel = client.channels.cache.get(lvl1ChanlId)


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
            `**AFFECTED_USER:** ${user.id} - @${user.username}#${user.discriminator}`,
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
     * Unknown Channel > DiscordAPIError[10003]: Unknown Channel
     * Cannot edit a message authored by another user > DiscordAPIError[50005]: Cannot edit a message authored by another user
     */

    // Determine what channel to send to.
    lvl0Test ? lvl1Channel.send(ERROR_MESSAGE).catch(error=>client.logger.error(error)) : lvl0Channel.send(ERROR_MESSAGE).catch(error=>client.logger.error(error))

    // Send to filtered channels
    let channelToSendTo = null

    const DiscordAPIError_50001 = `Missing Access`
    const DiscordAPIError_50013 = `Missing Permissions`
    const DiscordAPIError_50005 = `Cannot edit a message authored by another user`

    switch (error_message) {
        case DiscordAPIError_50001:
            channelToSendTo = DiscordAPIError_50001_Thread
            break
        case DiscordAPIError_50013:
            channelToSendTo = DiscordAPIError_50013_Thread
            break
        case DiscordAPIError_50005:
            channelToSendTo = DiscordAPIError_50005_Thread
            break
        default:
            if (error_stack && error_stack.includes(`DiscordAPIError`)){
                channelToSendTo = DiscordAPIError_Thread
            } else {
                channelToSendTo = lvl1_Thread
            }
            break
    }
    return channelToSendTo.send(ERROR_MESSAGE).catch(error=>client.logger.error(error))
}
module.exports = errorRelay