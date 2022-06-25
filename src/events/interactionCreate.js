const availablePermissions = require(`../config/permissions`)
const getUserPermission = require(`../libs/permissions`)
const {
    cooldown
} = require(`../config/commands`)
module.exports = async(client, interaction) => {
    if (!interaction.isCommand()) return
    let command = client.commands.get(interaction.commandName)
        // Ignore non-registered commands
    if (!command) return
    const reply = client.responseLibs(interaction)
    const options = interaction.options
    const targetCommand = interaction.commandName
        // Handle if user doesn't have enough permission level to use the command
    const userPermission = getUserPermission(interaction, interaction.user.id)
    if (command.permissionLevel > userPermission.level) return reply.send(``, {
            customHeader: [
                `You need LV${command.permissionLevel} (${availablePermissions[command.permissionLevel].name}) privilege to use this command.`,
                interaction.user.displayAvatarURL({
                    dynamic: true
                })
            ]
        })
        // Handle cooldowns
    const instanceId = `CMD_${command.name.toUpperCase()}_${interaction.user.id}@${interaction.guildId}`
    if (client.cooldowns.has(instanceId)) {
        const userCooldown = client.cooldowns.get(instanceId)
        const diff = cooldown - ((Date.now() - userCooldown) / 1000)
        if (diff > 0) return reply.send(client.locales.en.COMMAND.STILL_COOLDOWN, {
            socket: {
                emoji: await client.getEmoji(`AnnieYandereAnim`),
                user: interaction.user.username,
                timeLeft: diff.toFixed(1)
            }
        })
    }
    client.cooldowns.set(instanceId, Date.now())
        // Handle user locale
    const userLanguage = await client.db.getUserLocale(interaction.user.id)
    let locale = null
    try {
        locale = client.locales[userLanguage.lang]
    } catch (error) {
        locale = client.locales.en
    }
    // Prevent user with uncomplete data to proceed the command.
    if ((await client.db.redis.sismember(`VALIDATED_USERID`, interaction.user.id)) === 0) {
        return reply.send(locale.USER.REGISTRATION_ON_PROCESS)
    }
    try {
        const initTime = process.hrtime()
        await command.Iexecute(client, reply, interaction, options, locale)

        //  Dispose
        command = null
        return client.db.recordsCommandUsage({
            guild_id: interaction.guildId,
            user_id: interaction.user.id,
            command_alias: targetCommand,
            resolved_in: client.getBenchmark(initTime)
        })
    } catch (err) {
        if (err) client.logger.error(err)

        await interaction.reply({
            content: `An error occured while trying to process that command`,
            ephemeral: true
        })
    }
}