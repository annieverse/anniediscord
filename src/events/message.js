const getUserPermission = require(`../libs/permissions`)
const autoResponderController = require(`../controllers/autoResponder`)
const commandController = require(`../controllers/commands`)
/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * @since 4.0.1
 */
module.exports = async (client, message) => {
    //  Ignore if its from a bot user
    if (message.author.bot) return client.logger.debug(`blocked bot-user message.`)
    //  Reject further flow if message is dm-typed.
    if (message.channel.type === `dm`) return client.logger.debug(`blocked incoming DM.`)
    let permission = await getUserPermission(message, message.author.id)
    //  Ignore any user interaction in dev environment
    if (client.dev && permission.level < 4) return client.logger.debug(`[Event.message] ${message.author.id}@${message.guild.id} blocked in dev environment.`)
    client.db.validateUser(message.author.id, message.guild.id, message.author.username)
    //  Check if AR module is enabled.
    if (message.guild.configs.get(`AR_MODULE`).value) autoResponderController(client, message)
    //  Check if message is identified as command.
    if (message.content.startsWith(client.prefix) && message.content.length >= (client.prefix.length + 1)) return commandController(client, message, permission)
    //  Automatically executing chat points when no other module requirements are met
    const gainingId = `POINTS_${message.author.id}@${message.guild.id}`
    if (await client.isCooldown(gainingId)) return
    client.setCooldown(gainingId, 60)
    client.db.updateInventory({
        itemId: 52,
        value: Math.floor(Math.random() * (5 - 1 + 1) + 1), 
        userId: message.author.id,
        guildId: message.guild.id
    })
    client.experienceLibs(message).execute()
}
