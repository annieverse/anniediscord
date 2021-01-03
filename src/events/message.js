/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * @since 4.0.1
 */
module.exports = async (bot, message) => {
    let user = message.author
    let guild = message.guild
    const instanceId = `[Event.message] ${user.id}@${guild.id}`
    //  Ignore if its from a bot user
    if (user.bot) return
    user.permissions = bot.permissionController(message).getUserPermission(user.id)
    //  Ignore any user interaction in dev environment
    if (bot.dev && user.permissions.level < 1) return bot.logger.debug(`${instanceId} blocked in dev environment.`)
    //  Reject further flow if message is dm-typed.
    if (message.channel.type === `dm`) return bot.logger.debug(`${instanceId} blocked incoming DM.`)
    //  Ran data validation on each user for every 60 minutes.
    const dataValidateID = `DATA_VALIDATION@${user.id}`
    bot.db.redis.get(dataValidateID).then(async res => {
        if (res !== null) return
        await bot.db.validateUser(user.id, guild.id, user.username)
        bot.db.redis.set(dataValidateID, `1`, `EX`, 3600)
    })
    //  Check if AR module is enabled.
    if (bot.guilds.cache.get(guild.id).configs.get(`AR_MODULE`).value) bot.autoResponderController(message)
    //  Check if message is identified as command.
    const msg = message.content
    if (msg.startsWith(bot.prefix) && msg.length >= (bot.prefix.length + 1)) return bot.commandController(message)
    //  Automatically executing [Points Controller] when no other module requirements are met
    return bot.pointsController(message)
}