const Response = require(`../libs/response`)
const findCommandProperties = require(`../utils/findCommandProperties`)
const availablePermissions = require(`../config/permissions`)
const Pistachio = require(`../libs/pistachio`)
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
    const userPermission = getUserPermission(message, message.author.id)
    const controllerId = `[Controller.Command][${message.author.id}@${message.guild.id}]`
    const instanceId = `CMD_${message.author.id}@${message.guild.id}`
    const initTime = process.hrtime()
    const tokenizedContent = message.content.split(` `)
    const targetCommand = tokenizedContent[0].slice(client.prefix.length).toLowerCase()
    const command = findCommandProperties(client, targetCommand)
    // Handle if no files are match with the given command name
    if (!command) return client.logger.debug(`${controllerId} there's no matched command with target key '${targetCommand}'`) 
    let reply = new Response(message)
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
            .catch(e => client.logger.warn(`${instanceId} <FAIL> deleting author's message on unallowed command > ${e.message}`))
        }
    }
    // Handle if user doesn't have enough permission level to use the command
    if (command.permissionLevel > userPermission.level) return reply.send(``, {customHeader: [`You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`, message.author.displayAvatarURL({dynamic: true})]})
    try {
        let userCooldown = await client.db.redis.get(instanceId)
        if (userCooldown) return reply.send(client.locale.en.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: message.author.username,
                timeLeft: (cooldown - ((Date.now() - userCooldown) / 1000)).toFixed(1)
            }
        })
        client.db.redis.set(instanceId, Date.now(), `EX`, cooldown)
        const baseCmdControllerComponents = ({bot: client, message: message, commandProperties: command})
        const cmdComponents = new Pistachio(baseCmdControllerComponents)
        new command.start(baseCmdControllerComponents).execute(cmdComponents)
        //	Log and store the cmd usage to database.
        client.db.recordsCommandUsage({
            guild_id: message.guild.id,
            user_id: message.author.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    }
    catch(e) {
        client.logger.warn(`${controllerId} Oops, something went wrong. > ${e.stack}`)
        if (client.dev) return reply.send(client.locale.en.ERROR_ON_DEV, {
            socket: {
                error: e,
                emoji: await client.getEmoji(`AnnieThinking`)
            }
        })
        //  Handle unsupported image type from buffer-image-size package
        if ([`unsupported file type: undefined`, `Unsupported image type`].includes(e.message)) {
            reply.send(client.locale.en.ERROR_UNSUPPORTED_FILE_TYPE, {
                socket: {
                    emoji: await client.getEmoji(`692428843058724994`)
                }
            })
        }
        //  Handle missing-permission error
        else if (e.code === 50013) {
            reply.send(client.locale.en.ERROR_MISSING_PERMISSION, {
                socket: {
                    emoji: await client.getEmoji(`AnnieCry`)
                }
            })
            .catch(permErr => client.logger.warn(`Fail to notify ${controllerId} due to missing SEND_MESSAGE permission. > ${permErr.message}`))
        }
        else {
            reply.send(client.locale.en.ERROR_ON_PRODUCTION, {socket: {emoji: await client.getEmoji(`AnniePout`)}})
        }
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
