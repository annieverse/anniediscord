const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/gacha`)
const closestBelow = require(`../../utils/closestBelow`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const random = require(`../../utils/random`)
/**
 * Opens a Lucky Ticket and wins various exclusive rewards!
 * @author klerikdust
 */
module.exports = {
    name: `gacha`,
	aliases: [`gch`,`gacha`, `reroll`],
	description: `Opens a Lucky Ticket and wins various rewards such as card collection and cosmetic items!`,
	usage: `gacha <Amount>`,
	permissionLevel: 0,
    amountToOpenRanges: [1, 10],
    async execute(client, reply, message, arg, locale) {
        const userData = await (new User(client, message)).requestMetadata(message.author, 2)
        const amountToOpen = arg ? trueInt(arg) : 1
        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(amountToOpen)) return reply.send(locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: {emoji: await client.getEmoji(`781504248868634627`)}
        })
        //  Direct roll if user already has the tickets.
        const instanceId = `GACHA_SESSION:${message.guild.id}@${message.author.id}` 
        if (userData.inventory.lucky_ticket >= amountToOpen) return this.startsRoll(client, reply, message, arg, locale, instanceId, userData)
        const gachaItem = await client.db.getItem(71)
        const userCurrentCurrency = userData.inventory.artcoins
        const amountToPay = 120*amountToOpen
        //  Handle if user doesn't have enough artcoins to buy tickets
        if (userCurrentCurrency < amountToPay) return reply.send(locale.GACHA.SUGGEST_TO_GRIND, {
            simplified: true,
            socket: {emoji: await client.getEmoji(`692428927620087850`)}
        })
        if (await client.db.redis.exists(instanceId)) return reply.send(locale.GACHA.SESSION_STILL_ACTIVE)

        /**
         * --------------------
         * 1.) GIVE PURCHASE OFFER TO USER
         * --------------------
         */
        const suggestToBuy = await reply.send(locale.GACHA.SUGGEST_TO_BUY, {
            footer: locale.GACHA.UPON_PURCHASE_WARN,
            socket: {
                amount: amountToOpen
            }
        })
        const c = new Confirmator(message, reply) 
        await c.setup(message.author.id, suggestToBuy)
        //  Timeout in 30 seconds
        client.db.redis.set(instanceId, `1`, `EX`, 30)
        c.onAccept(async () => {
            suggestToBuy.delete()
            //  Deduct balance & deliver lucky tickets
            client.db.updateInventory({itemId: 52, value: amountToPay, operation: `-`, userId: message.author.id, guildId: message.guild.id})
            await client.db.updateInventory({itemId: 71, value: amountToOpen, userId: message.author.id, guildId: message.guild.id})
            this.startsRoll(client, reply, message, arg, locale, instanceId, userData)
        })
    },

    /**
     * Rolling loots
     * @return {void}
     */
    async startsRoll(client, reply, message, arg, locale, instanceId, userData) {
        const rewardsPool = await client.db.getGachaRewardsPool()
        //  Handle if no rewards are available to be pulled from gacha.
        if (!rewardsPool.length) return reply.send(locale.GACHA.UNAVAILABLE_REWARDS, {socket: {emoji: client.getEmoji(`AnnieCry`)} })
        const fetching = await reply.send(random(locale.GACHA.OPENING_WORDS), {
            simplified: true,
            socket: {
                user: message.author.username,
                emoji: await client.getEmoji(`781504248868634627`)
            }
        })
        //  Registering loot
        let loots = []
        const drawCount = this.drawCounts(arg)
        for (let i=0; i<drawCount; i++) {
            const loot = this.getLoot(rewardsPool)
            loots.push(loot)
        }
        //  Subtract user's box
        client.db.updateInventory({itemId: 71, value: drawCount, operation: `-`, userId: message.author.id, guildId: message.guild.id})
        //  Storing received loots into user's inventory
        for (let i=0; i<loots.length; i++) {
            const item = loots[i]
            await client.db.updateInventory({itemId: item.item_id, value: item.quantity, userId: message.author.id, guildId: message.guild.id})
        }
        client.db.redis.del(instanceId)
        //  Displaying result
        reply.send(locale.GACHA.HEADER, {
            prebuffer: true,
            customHeader:  [`${message.author.username} has opened Pandora Box!`, message.author.displayAvatarURL()],
            image: await new GUI(loots, drawCount, userData).build(),
            socket: {
                items: await this.displayDetailedLoots(client, loots)
            }
        })
        return fetching.delete()
    },

    /**
     * Aggregate and prettify loots into a readable list.
     * @param {Client} client Current bot/client instance.
     * @param {object} loots Source loots
     * @returns {string}
     */
    async displayDetailedLoots(client, loots) {
        let str = ``
        let items = loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i=0; i<uniqueItems.length; i++) {
            const item = loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `╰☆～(${item[0].rarity_name}/${item[0].type_name}) ${receivedAmount}x ${uniqueItems[i]}\n`
        }
        return str
    },

    /**
     * Get possible item from given rewards pool (returned result from `Database.getGachaRewardsPool()`).
     * Uses basic RNG by weight.
     * @param {array} [rewardsPool=[]] returned array from `Database.getGachaRewardsPool()`
     * @returns {object}
     */
    getLoot(rewardsPool=[]) {
        const totalProbability = rewardsPool.reduce((total, item) => total + item.weight, 0)
        const weightsPool = rewardsPool.map(item => item.weight)
        let rng = Math.random() * totalProbability
        //  Handle if rng is hitting infinity, auto select fragments
        if (rng === `-infinity`) rng = 50
        const fitInRanges = closestBelow(weightsPool, rng)
        const item = rewardsPool.filter(item => item.weight === fitInRanges)
        //  Variable 'result' will determine if there are multiple items in the same weight
        //  then randomize the array. Otherwise, returns the first index.
        const result = item.length > 1 ? item[Math.floor(Math.random () * item.length)] : item[0]
        return result
    },

    /**
     * Determine user's gacha counts
     * @param {string} arg
     * @return {number}
     */
    drawCounts(arg) {
        return !arg || arg == 1 ? 1 : 10
    }
}
