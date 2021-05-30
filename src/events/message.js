const autoResponderController = require(`../controllers/autoResponder`)
const commandController = require(`../controllers/commands`)
/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * @since 4.0.1
 */
module.exports = (client, message) => {
    //  Ignore if its from a bot user
    if (message.author.bot) return 
    //  Reject further flow if message is dm-typed.
    if (message.channel.type === `dm`) return 
    //  Ensure that guild configs have been properly loaded first
    if (!message.guild.configs) return
    client.db.validateUser(message.author.id, message.guild.id, message.author.username)
    //  Check if AR module is enabled.
    if (message.guild.configs.get(`AR_MODULE`).value) autoResponderController(client, message)
    //  Check if message is identified as command.
    const prefix = client.prefix
    if (message.content.startsWith(prefix) && message.content.length >= prefix.length) return commandController(client, message)
    //  Automatically executing chat points when no other module requirements are met
    const gainingId = `POINTS_${message.author.id}@${message.guild.id}`
    client.db.redis.get(gainingId)
    .then(res => {
        if (res) return
        //  Expire cooldown state after 1 minute
        client.db.redis.set(gainingId, 1, `EX`, 60)
        client.db.updateInventory({
            itemId: 52,
            value: Math.floor(Math.random() * (5 - 1 + 1) + 1), 
            userId: message.author.id,
            guildId: message.guild.id
        })
        if (!message.guild.configs.get(`EXP_MODULE`).value) return
        client.experienceLibs(message.member, message.guild, message.channel).execute()
    })
    .catch(e => {
        client.logger.warn(`${gainingId} <FAIL> on message event > ${e.message}`)
    })
}
