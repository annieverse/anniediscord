const Response = require(`../libs/response`)
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
    const targetCommand = message.content.split(` `)[0].slice(client.prefix.length).toLowerCase()
    const command = findCommandProperties(client, targetCommand)
    // Ignore non-registered commands
    if (!command) return 
    const reply = new Response(message)
    // Handle non-command-allowed channels
    const commandChannels = message.guild.configs.get(`COMMAND_CHANNELS`).value
    if ((commandChannels.length > 0) && !command.name.startsWith(`setCommand`)) {
        if (!commandChannels.includes(message.channel.id)) {
            await reply.send(client.locale.en.NON_COMMAND_CHANNEL, {
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
        if (diff > 0) return reply.send(client.locale.en.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: message.author.username,
                timeLeft: diff.toFixed(1)
            }
        })
    }
    client.cooldowns.set(instanceId, Date.now())
    // Attempt on running target command
    try {
        const initTime = process.hrtime()
        let cmdRan = await new command.start({
            bot: client, 
            message: message, 
            commandProperties: command
        }).execute()
        //  Dispose
        cmdRan = null
        return client.db.recordsCommandUsage({
            guild_id: message.guild.id,
            user_id: message.author.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    }
    catch(e) {
        if (client.dev) return reply.send(client.locale.en.ERROR_ON_DEV, {
            socket: {
                error: e,
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        })
        //  Unsupported image type from buffer-image-size package
        if ([`unsupported file type: undefined`, `Unsupported image type`].includes(e.message)) {
            reply.send(client.locale.en.ERROR_UNSUPPORTED_FILE_TYPE, {
                socket: {
                    emoji: await client.getEmoji(`692428843058724994`)
                }
            })
        }
        //  Missing-permission error
        else if (e.code === 50013) {
            reply.send(client.locale.en.ERROR_MISSING_PERMISSION, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            })
            .catch(permErr => permErr)
        }
        else {
            reply.send(client.locale.en.ERROR_ON_PRODUCTION, {socket: {emoji: await client.getEmoji(`AnniePout`)}})
        }
        //  Report to support server
        client.shard.broadcastEval(`
            (async () => {
                const channel = await this.channels.cache.get('797521371889532988')
                if (channel) {
                    channel.send(\`─────────────────☆～:;
**GUILD_ID:** ${message.guild.id} - ${message.guild.name}
**AFFECTED_USER:** ${message.author.id} - @${message.author.username}#${message.author.discriminator}
**AFFECTED_CMD:** ${targetCommand}
**TIMESTAMP:** ${new Date()}
**ISSUE_TRACE:** ${e.message}
─────────────────☆～:;\`)
                }
            })()
        `)
    }
}
