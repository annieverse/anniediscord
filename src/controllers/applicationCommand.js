const availablePermissions = require(`../config/permissions`)
const getUserPermission = require(`../libs/permissions`)
const {
    cooldown
} = require(`../config/commands`)
const { InteractionType } = require(`discord.js`)
const levelZeroErrors = require(`../utils/errorLevels.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const cacheReset = require(`../utils/cacheReset.js`)
module.exports = async (client, interaction, command) => {
    // Handle localization
    const userData = await client.db.userUtils.getUserLocale(interaction.user.id)
    const locale = client.getTargetLocales(userData.lang)
    const reply = client.responseLibs(interaction, false, locale)

    // Check Bot's permissions before procceding
    let checkPerm = false
    try {
        checkPerm = reply.checkPermissions(interaction.channel)
        if (!checkPerm) return await reply.send(locale.ERROR_MISSING_PERMISSION)
    } catch (e) {
        const internalError = e.message.startsWith(`[Internal Error]`)
        // Handle cache(s)
        if (internalError) return
        return client.shard.broadcastEval(errorRelay, { context: { fileName: `ApplicationCommand.js`, errorType: `normal`, error_message: e.message, error_stack: e.stack, levelZeroErrors: levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    }

    const options = interaction.options
    const targetCommand = interaction.commandName
    // Handle if user doesn't have enough permission level to use the command
    const userPermission = getUserPermission(interaction, interaction.user.id)
    if (command.permissionLevel > userPermission.level) return await reply.send(``, {
        customHeader: [
            `You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`,
            interaction.user.displayAvatarURL()
        ]
    })
    // Handle cooldowns
    const instanceId = `CMD_${command.name.toUpperCase()}_${interaction.user.id}@${interaction.guildId}`
    if (client.cooldowns.has(instanceId)) {
        const userCooldown = client.cooldowns.get(instanceId)
        const diff = cooldown - ((Date.now() - userCooldown) / 1000)
        if (diff > 0) return await reply.send(locale.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: interaction.user.username,
                timeLeft: diff.toFixed(1)
            }
        })
    }
    client.cooldowns.set(instanceId, Date.now())
    // Prevent user with uncomplete data to proceed the command.
    if ((await client.db.redis.sIsMember(`VALIDATED_USERID`, interaction.user.id)) === 0) {
        return await reply.send(locale.USER.REGISTRATION_ON_PROCESS).catch(e => {
            const internalError = e.message.startsWith(`[Internal Error]`)
            // Handle cache(s)
            if (internalError) return
            return client.logger.error(e)
        })
    }
    try {
        const initTime = process.hrtime()
        if (interaction.type === InteractionType.ApplicationCommand) await command.Iexecute(client, reply, interaction, options, locale)
        //  Dispose
        command = null
        return client.db.systemUtils.recordsCommandUsage({
            guild_id: interaction.guildId,
            user_id: interaction.user.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    } catch (err) {
        client.logger.error(err)
        const internalError = err.message.startsWith(`[Internal Error]`)
        // Handle cache(s)
        if (internalError) cacheReset(client, command.name, interaction.member.id, interaction.guildId)
        if (client.dev) return await reply.send(locale.ERROR_ON_DEV, {
            socket: {
                error: err.stack,
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))

        if ([`unsupported file type: undefined`, `Unsupported image type`].includes(err.message)) {
            await reply.send(locale.ERROR_UNSUPPORTED_FILE_TYPE, {
                socket: {
                    emoji: await client.getEmoji(`692428843058724994`)
                },
                ephemeral: true
            }).catch(err => client.logger.error(`[ERROR_UNSUPPORTED_FILE_TYPE] Unable to send message to channel > ${err}`))
        }
        //  Missing-permission error
        else if (err.code === 50013 || internalError) {
            await reply.send(locale.ERROR_MISSING_PERMISSION, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                },
                ephemeral: true
            }).catch(err => client.logger.error(`[ERROR_MISSING_PERMISSION] Unable to send message to channel > ${err}`))
                .catch(permErr => permErr)
        } else {
            await reply.send(locale.ERROR_ON_PRODUCTION, {
                socket: { emoji: await client.getEmoji(`AnniePout`) },
                ephemeral: true
            }).catch(err => client.logger.error(`[ERROR_ON_PRODUCTION] Unable to send message to channel > ${err}`))
        }
        //  Report to support server
        if (internalError) return
        client.shard.broadcastEval(errorRelay, { context: { fileName: `applicationCommand.js`, errorType: `appcmd`, error_message: err.message, guildId: interaction.guildId, userId: interaction.user.id, providedArgs: JSON.stringify(interaction.options.data), targetCommand: targetCommand, levelZeroErrors: levelZeroErrors } }).catch(err => client.logger.error(`[Other] Unable to send message to channel > ${err}`))
    }
}