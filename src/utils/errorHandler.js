
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
    const lvl0ChanCacheTest = !client.channels.cache.has(lvl0ChanlId)
    if (lvl0ChanCacheTest) await client.channels.fetch(lvl0ChanlId)
    const lvl1ChanlId = `848425166295269396`
    const lvl1ChanCacheTest = !client.channels.cache.has(lvl1ChanlId)
    if (lvl1ChanCacheTest) await client.channels.fetch(lvl1ChanlId)
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
    // Determine what channel to send to.
    return lvl0Test ? lvl1Channel.send(ERROR_MESSAGE) : lvl0Channel.send(ERROR_MESSAGE)
}
module.exports = errorRelay