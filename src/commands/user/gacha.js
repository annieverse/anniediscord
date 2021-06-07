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
    loots: [],
    amountToOpenRanges: [1, 10],
    async execute(client, reply, message, arg, locale) {
        const userData = await (new User(client, message)).requestMetadata(message.author, 2)
        this.args = arg.split(` `)
    	this.amountToOpen = this.args[0] ? trueInt(this.args[0]) : 1
        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(this.amountToOpen)) return reply.send(locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: {emoji: await client.getEmoji(`781504248868634627`)}
        })
        //  Direct roll if user already has the tickets.
        if (userData.inventory.lucky_ticket >= this.amountToOpen) return this.startsRoll(client, reply, message, arg ,locale)
        /**
         * --------------------
         * STARTS PURCHASE CHAINING
         * --------------------
         * @author klerikdust
         * Q: What's the reason of adding this?
         * A: I've seen a lot of people, especially the newbie ones are often
         * having trouble of how to purchase the stuff to participate in the gacha. Browsing through the shop
         * usually kind of overwhelming them, which might intimidates them to look further.
         * My hope after implementing this so-called-purchase-chaining model is, we'll able to gauge new user's interest
         * to play with our gacha with small effort (no need to get through the buy command first)
         * and enjoy the rest of the content.
         */
        const insufficientTicketWarning = await reply.send(locale.GACHA.INSUFFICIENT_TICKET, {
		   socket: {emoji: await client.getEmoji(`751020535865016420`), prefix: client.prefix}
        })
        const gachaItem = await client.db.getItem(71)
        const payment = await client.db.getPriceOf(71)
        const paymentItem = await client.db.getItem(payment.item_price_id)
        const userCurrentCurrency = userData.inventory[paymentItem.alias]
        const amountToPay = payment.price*this.amountToOpen

        //  Handle if user doesn't have enough artcoins to buy tickets
        if (userCurrentCurrency < amountToPay) return reply.send(locale.GACHA.SUGGEST_TO_GRIND, {
            simplified: true,
            socket: {emoji: await client.getEmoji(`692428927620087850`)}
        })

        /**
         * --------------------
         * 1.) GIVE PURCHASE OFFER TO USER
         * --------------------
         */
        const suggestToBuy = await reply.send(locale.GACHA.SUGGEST_TO_BUY, {
            simplified: true,
            socket: {emoji: await client.getEmoji(`lucky_ticket`)}
        })
        const c = new Confirmator(message, reply) 
        await c.setup(message.author.id, suggestToBuy)
        c.onAccept(async () => {
            suggestToBuy.delete()
            insufficientTicketWarning.delete()
            //  Deduct balance & deliver lucky tickets
            await client.db.updateInventory({itemId: paymentItem.item_id, value: amountToPay, operation: `-`, userId: message.author.id, guildId: message.guild.id})
            await client.db.updateInventory({itemId: 71, value: this.amountToOpen, userId: message.author.id, guildId: message.guild.id})
            this.startsRoll(client, reply, message, arg, locale)
        })
    },

    /**
     * Rolling loots
     * @return {void}
     */
    async startsRoll(client, reply, message, arg, locale) {
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
        for (let i=0; i<this.amountToOpen; i++) {
            const loot = this.getLoot(rewardsPool)
            this.loots.push(loot)
        }
        //  Subtract user's lucky tickets
        client.db.updateInventory({itemId: 71, value: this.amountToOpen, operation: `-`, userId: message.author.id, guildId: message.guild.id})
        //  Storing received loots into user's inventory
        for (let i=0; i<this.loots.length; i++) {
            const item = this.loots[i]
            await client.db.updateInventory({itemId: item.item_id, value: item.quantity, userId: message.author.id, guildId: message.guild.id})
        }

        //  Displaying result
        reply.send(locale.COMMAND.TITLE, {
            prebuffer: true,
            image: await new GUI(this.loots, this.drawCounts).build(),
            simplified: true,
            socket: {
                command: `has opened ${this.drawCounts} Lucky Tickets!`,
                user: message.author.username,
                emoji: await client.getEmoji(`lucky_ticket`)
            }
        })
        fetching.delete()
        return reply.send(await this.displayDetailedLoots(client), {simplified: true})   
    },

    /**
     * Aggregate and prettify this.loots into a readable list.
     * @param {Client} client Current bot/client instance.
     * @returns {string}
     */
    async displayDetailedLoots(client) {
        let str = ``
        let items = this.loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i=0; i<uniqueItems.length; i++) {
            const item = this.loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `${await client.getEmoji(item[0].alias)} **[${item[0].type_name}] ${receivedAmount}x ${uniqueItems[i]}**\n`
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
     * type {number}
     */
    get drawCounts() {
        return !this.args[0] || this.args[0] == 1 ? 1 : 10
    }
}
