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
    //  Display quick prefix hint when mentioned.
    //  Subtracted number at message.content.length is the whitespace made during mention.
    if (message.mentions.users.has(client.user.id) && (message.content.length-1) <= `<@${client.user.id}>`.length) {
        //  To avoid spam, cache the 15s cooldown per guild
        const prefixHintId = `PREFIX_HINT@${message.guild.id}`
        return client.db.redis.exists(prefixHintId).then(res => {
            if (res) return
            client.db.redis.set(prefixHintId, 1, `EX`, 15)
            client.responseLibs(message).send(`Type **\`${client.prefix}help\`** to see my commands. ♡`, {
                deleteIn: 5
            })
        })
    }
    //  Check if AR module is enabled.
    if (message.guild.configs.get(`AR_MODULE`).value) autoResponderController(client, message)
    //  Check if message is identified as command.
    const prefix = client.prefix
    if (message.content.startsWith(prefix) && message.content.length >= prefix.length) return commandController(client, message)
    //  Automatically executing chat points when no other module requirements are met
    const cooldown = 60 // in seconds
    const gainingId = `POINTS_${message.author.id}@${message.guild.id}`
    if (client.cooldowns.has(gainingId)) {
        const userCooldown = client.cooldowns.get(gainingId)
        const diff = cooldown - ((Date.now() - userCooldown) / 1000)
        //  Hold gaining if cooldown still has less than 60 seconds in difference
        if (diff > 0) return
    }
    client.cooldowns.set(gainingId, Date.now())
    client.db.updateInventory({
        itemId: 52,
        value: Math.floor(Math.random() * (5 - 1 + 1) + 1), 
        userId: message.author.id,
        guildId: message.guild.id
    })
    if (!message.guild.configs.get(`EXP_MODULE`).value) return
    client.experienceLibs(message.member, message.guild, message.channel).execute()
}
