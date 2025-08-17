const autoResponderController = require(`../controllers/autoResponder`)
const getNumberInRange = require(`../utils/getNumberInRange`)
const commandController = require(`../controllers/commands`)
const { Message } = require(`discord.js`)
/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * @since 4.0.1
 */
/**
 * 
 * @param {Message} message 
 * @event messageCreate
 */
const messageHandler = async (client, message) => {
    if (!client.isReady()) return
    //  Ignore if its from a bot user
    if (message.author.bot) return
    //  Reject further flow if message is dm-typed.
    if (message.channel.isDMBased()) return
    //  Ensure that guild configs have been properly loaded first
    if (!message.guild.configs) return
    try {
        await client.db.databaseUtils.validateUserEntry(message.author.id, message.author.username)
    } catch (error) {
        return client.logger.error(`Failed to validate user entry for ${message.author.id} (${message.author.username})`, error)
    }

    await client.db.guildUtils.registerGuild(message.guild)
    //  Display quick prefix hint when mentioned.
    //  Subtracted number at message.content.length is the whitespace made during mention.
    const prefix = message.guild.configs.get(`PREFIX`).value
    if (message.mentions.users.has(client.user.id) && (message.content.length - 1) <= `<@${client.user.id}>`.length) {
        //  To avoid spam, cache the 15s cooldown per guild
        const prefixHintId = `PREFIX_HINT@${message.guild.id}`
        return client.db.databaseUtils.doesCacheExist(prefixHintId)
            .then(res => {
                if (res) return
                client.db.databaseUtils.setCache(prefixHintId, `1`, { EX: 15 })
                client.responseLibs(message).send(`Type **\`${prefix}help\`** to see my commands. ♡`, {
                    deleteIn: 5
                })
            })
    }
    //  Check if AR module is enabled.
    if (message.guild.configs.get(`AR_MODULE`).value) autoResponderController(client, message)
    //  Check if message is identified as command.
    const startsWithPrefix = (message.content.startsWith(prefix) || message.content.startsWith(client.prefix))
    const possibleCmd = ((message.content.length >= prefix.length) || (message.content.length >= client.prefix.length))
    if (startsWithPrefix && possibleCmd) return commandController(client, message)


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
    const chatCurrencyBase = message.guild.configs.get(`CHAT_CURRENCY`).value
    client.db.redis.sMembers(`ARTCOINS_BUFF:${message.guild.id}@${message.author.id}`)
        .then(list => {
            const accumulatedCurrencyMultiplier = list.length > 0 ? 1 + list.reduce((p, c) => p + parseFloat(c)) : 1
            client.db.databaseUtils.updateInventory({
                itemId: 52,
                value: getNumberInRange(chatCurrencyBase) * accumulatedCurrencyMultiplier,
                userId: message.author.id,
                guildId: message.guild.id
            })
        })
    if (!message.guild.configs.get(`EXP_MODULE`).value) return
    const chatExpBase = message.guild.configs.get(`CHAT_EXP`).value

    const userData = await client.db.userUtils.getUserLocale(message.author.id)
    client.localization.lang = userData.lang
    const locale = (key) => client.localization.findLocale(key)

    client.db.redis.sMembers(`EXP_BUFF:${message.guild.id}@${message.author.id}`)
        .then(list => {
            const accumulatedExpMultiplier = list.length > 0 ? 1 + list.reduce((p, c) => p + parseFloat(c)) : 1
            client.experienceLibs(message.member, message.guild, message.channel, locale)
                .execute(getNumberInRange(chatExpBase) * accumulatedExpMultiplier)
        })

}
module.exports = { messageHandler }