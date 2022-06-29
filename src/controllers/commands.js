const findCommandProperties = require(`../utils/findCommandProperties`)
const availablePermissions = require(`../config/permissions`)
const { cooldown } = require(`../config/commands`)
const getUserPermission = require(`../libs/permissions`)
/**
 * Centralized Controller to handle incoming command request
 * @since 6.0.0
 * @param {object} [client={}] Current client's instance.
 * @param {object} [message={}] Target message's instance.
 * @return {winston}
 */
module.exports = async (client={}, message={}) => {
    const guildPrefix = message.guild.configs.get(`PREFIX`).value
    const prefix = message.content.startsWith(guildPrefix) ? guildPrefix : client.prefix
    const targetCommand = message.content.slice(prefix.length).split(` `)[0].toLowerCase()
    let command = findCommandProperties(client, targetCommand)
    // Ignore non-registered commands
    if (!command) return 
    //  Plus one from whitespace
    const arg = message.content.slice(prefix.length + targetCommand.length+1)
    // Ignore if user trying to use default prefix on a configured custom prefix against non-prefixImmune command
    if (message.content.startsWith(client.prefix) && (guildPrefix !== client.prefix) && !command.prefixImmune) return
    const reply = client.responseLibs(message)
    // Handle non-command-allowed channels
    const commandChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
    if ((commandChannels.length > 0) && !command.name.startsWith(`setCommand`)) {
        if (!commandChannels.includes(message.channel.id)) {
            await reply.send(client.locales.en.NON_COMMAND_CHANNEL, {
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
    if (command.permissionLevel > userPermission.level) return reply.send(``,
        {customHeader: [
            `You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`,
            message.author.displayAvatarURL({dynamic: true})
        ]}
    )
    // Handle cooldowns
    const instanceId = `CMD_${command.name.toUpperCase()}_${message.author.id}@${message.guild.id}`
    if (client.cooldowns.has(instanceId)) {
        const userCooldown = client.cooldowns.get(instanceId)
        const diff = cooldown - ((Date.now() - userCooldown) / 1000)
        if (diff > 0) return reply.send(client.locales.en.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: message.author.username,
                timeLeft: diff.toFixed(1)
            }
        })
    }
    client.cooldowns.set(instanceId, Date.now())
    const locale = client.locales.en
    // Prevent user with uncomplete data to proceed the command.
    if ((await client.db.redis.sismember(`VALIDATED_USERID`, message.author.id)) === 0) {
        return reply.send(locale.USER.REGISTRATION_ON_PROCESS)
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
        return client.db.recordsCommandUsage({
            guild_id: message.guild.id,
            user_id: message.author.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    }
    catch(e) {
        // if (client.dev) return reply.send(locale.ERROR_ON_DEV, {
        //     socket: {
        //         error: e.stack,
        //         emoji: await client.getEmoji(`AnnieThinking`)
        //     }
        // }).catch(err => client.logger.error(err))
        //  Unsupported image type from buffer-image-size package
        if ([`unsupported file type: undefined`, `Unsupported image type`].includes(e.message)) {
            reply.send(locale.ERROR_UNSUPPORTED_FILE_TYPE, {
                socket: {
                    emoji: await client.getEmoji(`692428843058724994`)
                }
            })
        }
        //  Missing-permission error
        else if (e.code === 50013) {
            reply.send(locale.ERROR_MISSING_PERMISSION, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            })
            .catch(permErr => permErr)
        } else {
            reply.send(locale.ERROR_ON_PRODUCTION, {socket: {emoji: await client.getEmoji(`AnniePout`)}})
        }
        //  Report to support server
        client.logger.error(e)
        client.shard.broadcastEval(formatedErrorLog, {context: {options: {msg:message, providedArguments:arg, error_name:e.name, error_message:e.message,error_stack:e.stack,targetCommand: targetCommand}}}).catch(error => client.logger.error(error))
    }
    async function formatedErrorLog(c,{options}) {
        const guild = await c.fetchGuildPreview(options.msg.guildId)
        const user = await c.users.fetch(options.msg.authorId)
        const date = new Date()
        const levelZeroErrors = [
            `Missing Permissions`,
            `Unsupported image type`,
            `unsupported file type: undefined`
        ]
        const providedArguments = options.providedArguments.length > 0 ? `\`${options.providedArguments}\`` : `No arguments provided`
        const channel = levelZeroErrors.includes(options.error_message) ? await c.channels.cache.get(`848425166295269396`) : await c.channels.cache.get(`797521371889532988`)
        if (channel){
            return channel.send({content: `─────────────────☆～:;\n**GUILD_ID:** ${guild.id} - ${guild.name}\n**AFFECTED_USER:** ${user.id} - @${user.username}#${user.discriminator}\n**AFFECTED_CMD:** ${options.targetCommand}\n**ARGUMENTS:** ${providedArguments}\n**TIMESTAMP:** ${date}\n**LOCAL_TIME:** <t:${Math.floor(date.getTime()/1000)}:F>\n**ISSUE_TRACE:** ${options.error_message}\n─────────────────☆～:;`})
        }
        return
    }
}