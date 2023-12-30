const autoResponderController = require(`../controllers/autoResponder`)
const getNumberInRange = require(`../utils/getNumberInRange`)
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
    client.db.databaseUtils.validateUserEntry(message.author.id, message.author.username)
    .then(async () => {
        await client.db.guildUtils.registerGuild(message.guild)
        //  Display quick prefix hint when mentioned.
        //  Subtracted number at message.content.length is the whitespace made during mention.
        const prefix = message.guild.configs.get(`PREFIX`).value
        if (message.mentions.users.has(client.user.id) && (message.content.length-1) <= `<@${client.user.id}>`.length) {
            //  To avoid spam, cache the 15s cooldown per guild
            const prefixHintId = `PREFIX_HINT@${message.guild.id}`
            return client.db.databaseUtils.doesCacheExist(prefixHintId)
            // return client.db.redis.exists(prefixHintId)
            .then(res => {
                if (res) return
                client.db.databaseUtils.setCache(prefixHintId,1,{EX:15})
                // client.db.redis.set(prefixHintId, 1, {EX: 15})
                client.responseLibs(message).send(`Type **\`${prefix}help\`** to see my commands. ♡`, {
                    deleteIn: 5
                })
            })
        }
        //  Check if AR module is enabled.
        if (message.guild.configs.get(`AR_MODULE`).value) autoResponderController(client, message)
        //  Check if message is identified as command.
        if ((message.content.startsWith(prefix) || message.content.startsWith(client.prefix)) 
            && ((message.content.length >= prefix.length) || (message.content.length >= client.prefix.length))) return commandController(client, message)
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
        
        // const userData = await client.db.userUtils.getUserLocale(message.author.id)
        // const locale = client.localizer.getTargetLocales(userData.lang)
        const locale = client.locales.en

        client.db.redis.sMembers(`EXP_BUFF:${message.guild.id}@${message.author.id}`)
        .then(list => {
            const accumulatedExpMultiplier = list.length > 0 ? 1 + list.reduce((p, c) => p + parseFloat(c)) : 1
            client.experienceLibs(message.member, message.guild, message.channel, locale)
                .execute(getNumberInRange(chatExpBase) * accumulatedExpMultiplier)
        })
    })
}
