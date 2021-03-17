const moment = require(`moment`)
const Response = require(`../libs/response`)
const findCommandProperties = require(`../utils/findCommandProperties`)
const availablePermissions = require(`../config/permissions`)
const Pistachio = require(`../libs/pistachio`)
const { cooldown } = require(`../config/commands`)
/**
 * Centralized Controller to handle incoming command request
 * @since 6.0.0
 * @param {object} [client={}] Current client's instance.
 * @param {object} [message={}] Target message's instance.
 * @param {object} [userPermission={}] User's privilege structure.
 * @return {winston}
 */
module.exports = async (client={}, message={}, userPermission={}) => {
    const controllerId = `[Controller.Command][${message.author.id}@${message.guild.id}]`
    const instanceId = `CMD_${message.author.id}@${message.guild.id}`
    const initTime = process.hrtime()
    const tokenizedContent = message.content.split(` `)
    const targetCommand = tokenizedContent[0].slice(client.prefix.length).toLowerCase()
    const command = findCommandProperties(client, targetCommand)
    // Handle if no files are match with the given command name
    if (!command) return client.logger.debug(`${controllerId} there's no matched command with target key '${targetCommand}'`) 
    // Handle if user doesn't have enough permission level to use the command
    let reply = new Response(message)
    if (command.permissionLevel > userPermission.level) {
        await reply.send(``, {customHeader: [`You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`, message.author.displayAvatarURL({dynamic: true})]})
        client.logger.debug(`${controllerId} tries to use PERM_LVL:${command.permissionLevel} command`)
        return reply = null
    }   
    try {
        //  Handle if command still in cooldown
        let userCooldown = await client.isCooldown(instanceId)
        if (userCooldown) {
            await reply.send(client.locale.en.COMMAND.STILL_COOLDOWN, {
                socket: {
                    emoji: client.getEmoji(`AnnieYandereAnim`),
                    user: message.author.username,
                    timeLeft: (cooldown - moment().diff(moment(userCooldown), `seconds`, true)).toFixed(2)
                }
            })
            return reply = null
        }
        client.setCooldown(instanceId, cooldown)
        let commandComponents = {bot: client, message: message, commandProperties: command}
        let PistachioComponents = new Pistachio(commandComponents)
        let cmd = new command.start(commandComponents)
        await cmd.execute(PistachioComponents)
        const cmdFinishTime = client.getBenchmark(initTime)
        const cmdUsageData = {
            guild_id: message.guild.id,
            user_id: message.author.id,
            command_alias: targetCommand,
            resolved_in: cmdFinishTime
        }
        //	Log and store the cmd usage to database.
        client.logger.info(`${controllerId} ran ${targetCommand} command (${cmdFinishTime})`)
        //  Prepare for GC
        reply = null
        cmd = null
        PistachioComponents = null
        commandComponents = null
        userCooldown = null
        return client.db.recordsCommandUsage(cmdUsageData)
    }
    catch(e) {
        client.logger.error(`${controllerId} Oops, something went wrong. > ${e.stack}`)
        if (!client.dev) {
            reply.send(client.locale.en.ERROR_ON_DEV, {
                socket: {
                    error: e,
                    emoji: client.getEmoji(`AnnieThinking`)
                }
            })
            return reply = null
        }
        reply.send(client.locale.en.ERROR_ON_PRODUCTION, {socket: {emoji: client.getEmoji(`AnniePout`)}})
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