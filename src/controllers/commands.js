const findCommandProperties = require(`../utils/findCommandProperties`)
const availablePermissions = require(`../config/permissions`)
const { cooldown } = require(`../config/commands`)
const getUserPermission = require(`../libs/permissions`)
const levelZeroErrors = require(`../utils/errorLevels.js`)
const errorRelay = require(`../utils/errorHandler.js`)

/**
 * Centralized Controller to handle incoming command request
 * @since 6.0.0
 * @param {object} [client={}] Current client's instance.
 * @param {object} [message={}] Target message's instance.
 * @return {winston}
 */
module.exports = async (client = {}, message = {}) => {
    const guildPrefix = message.guild.configs.get(`PREFIX`).value
    const prefix = message.content.startsWith(guildPrefix) ? guildPrefix : client.prefix
    const targetCommand = message.content.slice(prefix.length).split(` `)[0].toLowerCase()
    let command = findCommandProperties(client, targetCommand)
    // Ignore non-registered commands
    if (!command) return
    if (command.server_specific && !command.servers.includes(message.guildId)) return
    //  Plus one from whitespace
    const arg = message.content.slice(prefix.length + targetCommand.length + 1)
    // Ignore if user trying to use default prefix on a configured custom prefix against non-prefixImmune command
    if (message.content.startsWith(client.prefix) && (guildPrefix !== client.prefix) && !command.prefixImmune) return
    // Handle localization
    const userData = await client.db.userUtils.getUserLocale(message.author.id)
    const locale = client.getTargetLocales(userData.lang)
    let reply = client.responseLibs(message, false, locale)
    // Handle non-command-allowed channels
    const commandChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
    if ((commandChannels.length > 0) && !command.name.startsWith(`setCommand`)) {
        if (!commandChannels.includes(message.channel.id)) {
            await reply.send(locale.NON_COMMAND_CHANNEL, {
                deleteIn: 5,
                socket: {
                    user: message.author.username,
                    emoji: await client.getEmoji(`790338393015713812`)
                }
            })
            return message.delete()
                .catch(e => e)
        }
    }
    // Handle if user doesn't have enough permission level to use the command
    const userPermission = getUserPermission(message, message.author.id)
    if (command.permissionLevel > userPermission.level) return await reply.send(``,
        {
            customHeader: [
                `You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`,
                message.author.displayAvatarURL()
            ]
        }
    )
    // Handle cooldowns
    const instanceId = `CMD_${command.name.toUpperCase()}_${message.author.id}@${message.guild.id}`
    if (client.cooldowns.has(instanceId)) {
        const userCooldown = client.cooldowns.get(instanceId)
        const diff = cooldown - ((Date.now() - userCooldown) / 1000)
        if (diff > 0) return await reply.send(locale.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: message.author.username,
                timeLeft: diff.toFixed(1)
            }
        })
    }
    client.cooldowns.set(instanceId, Date.now())
    // Prevent user with uncomplete data to proceed the command.
    if ((await client.db.redis.sIsMember(`VALIDATED_USERID`, message.author.id)) === 0) {
        return await reply.send(locale.USER.REGISTRATION_ON_PROCESS)
    }
    try {
        const initTime = process.hrtime()
        await command.execute(
            client,
            reply,
            message,
            arg,
            locale,
            prefix
        )
        //  Dispose
        command = null
        return client.db.systemUtils.recordsCommandUsage({
            guild_id: message.guild.id,
            user_id: message.author.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    }
    catch (e) {
        client.logger.error(e)
        const internalError = e.message.startsWith(`[Internal Error]`)
        // Handle cache(s)
        if (internalError) {
            let sessionId = null
            switch (command.name) {
                case `makereward`:
                    sessionId = `REWARD_REGISTER:${message.guild.id}@${message.member.id}`
                    break
                case `setshop`:
                    sessionId = `SHOP_REGISTER:${message.guild.id}@${message.member.id}`
                    break
                case `cartcoin`:
                    sessionId = `${message.member.id}-${message.guild.id}-cartcoin`
                    break
                case `gacha`:
                    sessionId = `GACHA_SESSION:${message.guild.id}@${message.member.id}`
                    break
                case `quests`:
                    sessionId = `QUEST_SESSION_${message.member.id}@${message.guild.id}`
                    break
                default:
                    break
            }
            if (sessionId != null && await await client.db.databaseUtils.doesCacheExist(sessionId)) client.db.databaseUtils.delCache(sessionId)
        }
        if (client.dev) return await reply.send(locale.ERROR_ON_DEV, {
            socket: {
                error: e.stack,
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        //  Unsupported image type from buffer-image-size package
        if ([`unsupported file type: undefined`, `Unsupported image type`].includes(e.message)) {
            await reply.send(locale.ERROR_UNSUPPORTED_FILE_TYPE, {
                socket: {
                    emoji: await client.getEmoji(`692428843058724994`)
                }
            }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        }
        //  Missing-permission error
        else if (e.code === 50013 || internalError) {
            await reply.send(locale.ERROR_MISSING_PERMISSION, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        } else {
            await reply.send(locale.ERROR_ON_PRODUCTION, { socket: { emoji: await client.getEmoji(`AnniePout`) } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
        }
        //  Report to support server
        client.shard.broadcastEval(errorRelay, { context: { fileName: `commands.js`, errorType: `txtcmd`, guildId: message.guildId, userId: message.author.id, providedArgs: arg, error_message: e.message, targetCommand: targetCommand, levelZeroErrors:levelZeroErrors } }).catch(err => client.logger.error(`Unable to send message to channel > ${err}`))
    }
}