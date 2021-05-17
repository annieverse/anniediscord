const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/gacha`)
const closestBelow = require(`../../utils/closestBelow`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
const random = require(`../../utils/random`)
/**
 * Opens a Lucky Ticket and wins various exclusive rewards!
 * @author klerikdust
 */
class Gacha extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)

        /**
         * The received loots will be stored in this array
         * @type {array} 
         */
        this.loots = []

        /**
         * The maximum threeshold of opening gacha will be limited to range in this array.
         * @type {array} 
         */
        this.amountToOpenRanges = [1, 10]
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
    	await this.requestUserMetadata(2)
    	this.amountToOpen = this.args[0] ? trueInt(this.args[0]) : 1
        //  Handle if amount to be opened is out of defined range.
        if (!this.amountToOpenRanges.includes(this.amountToOpen)) return this.reply(this.locale.GACHA.AMOUNT_OUTOFRANGE, {
            socket: {emoji: await this.bot.getEmoji(`781504248868634627`)}
        })
        //  Direct roll if user already has the tickets.
        if (this.user.inventory.lucky_ticket >= this.amountToOpen) return this.startsRoll()
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
        this.insufficientTicketWarning = await this.reply(this.locale.GACHA.INSUFFICIENT_TICKET, {
		   socket: {emoji: await this.bot.getEmoji(`751020535865016420`), prefix: this.bot.prefix}
        })
        const gachaItem = await this.bot.db.getItem(71)
        const payment = await this.bot.db.getPriceOf(71)
        const paymentItem = await this.bot.db.getItem(payment.item_price_id)
        const userCurrentCurrency = this.user.inventory[paymentItem.alias]
        const amountToPay = payment.price*this.amountToOpen

        //  Handle if user doesn't have enough artcoins to buy tickets
        if (userCurrentCurrency < amountToPay) return this.reply(this.locale.GACHA.SUGGEST_TO_GRIND, {
            simplified: true,
            socket: {emoji: await this.bot.getEmoji(`692428927620087850`)}
        })

        /**
         * --------------------
         * 1.) GIVE PURCHASE OFFER TO USER
         * --------------------
         */
        this.suggestToBuy = await this.reply(this.locale.GACHA.SUGGEST_TO_BUY, {
            simplified: true,
            socket: {emoji: await this.bot.getEmoji(`lucky_ticket`)}
        })
		await this.addConfirmationButton(`suggestToBuy`, this.suggestToBuy)
        this.confirmationButtons.get(`suggestToBuy`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            this.suggestToBuy.delete()
            this.insufficientTicketWarning.delete()
            //  Deduct balance & deliver lucky tickets
            await this.bot.db.updateInventory({itemId: paymentItem.item_id, value: amountToPay, operation: `-`, userId: this.user.master.id, guildId: this.message.guild.id})
            await this.bot.db.updateInventory({itemId: 71, value: this.amountToOpen, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
            this.startsRoll()
        })
    }

    async startsRoll() {
        const rewardsPool = await this.bot.db.getGachaRewardsPool()
        //  Handle if no rewards are available to be pulled from gacha.
        if (!rewardsPool.length) return this.reply(this.locale.GACHA.UNAVAILABLE_REWARDS, {socket: {emoji: this.bot.getEmoji(`AnnieCry`)} })
        const fetching = await this.reply(random(this.locale.GACHA.OPENING_WORDS), {
            simplified: true,
            socket: {
                user: this.user.master.username,
                emoji: await this.bot.getEmoji(`781504248868634627`)
            }
        })
        //  Registering loot
        for (let i=0; i<this.amountToOpen; i++) {
            const loot = this.getLoot(rewardsPool)
            this.loots.push(loot)
        }

        //  Subtract user's lucky tickets
        this.bot.db.updateInventory({itemId: 71, value: this.amountToOpen, operation: `-`, userId: this.user.master.id, guildId: this.message.guild.id})
        //  Storing received loots into user's inventory
        for (let i=0; i<this.loots.length; i++) {
            const item = this.loots[i]
            this.bot.db.updateInventory({itemId: item.item_id, value: item.quantity, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
        }

        //  Displaying result
        this.reply(this.locale.COMMAND.TITLE, {
            prebuffer: true,
            image: await new GUI(this.loots, this.drawCounts).build(),
            simplified: true,
            socket: {
                command: `has opened ${this.drawCounts} Lucky Tickets!`,
                user: this.user.master.username,
                emoji: await this.bot.getEmoji(`lucky_ticket`)
            }
        })
        fetching.delete()
        return this.reply(await this.displayDetailedLoots(), {simplified: true})   
    }

    /**
     * Aggregate and prettify this.loots into a readable list.
     * @returns {string}
     */
    async displayDetailedLoots() {
        let str = ``
        let items = this.loots.map(item => item.name)
        let uniqueItems = [...new Set(items)]
        for (let i=0; i<uniqueItems.length; i++) {
            const item = this.loots.filter(item => item.name === uniqueItems[i])
            const amount = item.map(item => item.quantity)
            const receivedAmount = amount.reduce((acc, current) => acc + current)
            str += `${await this.bot.getEmoji(item[0].alias)} **[${item[0].type_name}] ${receivedAmount}x ${uniqueItems[i]}**\n`
        }
        return str
    }

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
        //  Handle if rng is hitting infinity
        if (rng === `-infinity`) rng = 100
        const fitInRanges = closestBelow(weightsPool, rng)
        const item = rewardsPool.filter(item => item.weight === fitInRanges)
        //  Variable 'result' will determine if there are multiple items in the same weight
        //  then randomize the array. Otherwise, returns the first index.
        const result = item.length > 1 ? item[Math.floor(Math.random () * item.length)] : item[0]
        return result
    }

    /**
     * Determine user's gacha counts
     * type {number}
     */
    get drawCounts() {
        return !this.args[0] || this.args[0] == 1 ? 1 : 10
    }

}

module.exports.help = {
	start: Gacha,
	name: `gacha`,
	aliases: [`gch`,`gacha`, `reroll`],
	description: `Opens a Lucky Ticket and wins various rewards such as card collection and cosmetic items!`,
	usage: `gacha <Amount>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}
